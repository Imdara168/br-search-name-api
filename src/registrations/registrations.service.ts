import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { BulkCreateRegistrationDto } from './dto/bulk-create-registration.dto';

const BULK_IMPORT_BATCH_SIZE = 5000;
const MAX_IMPORT_ROWS = 100000;

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  private sanitizeName(name: string, isEnglishField: boolean): string {
    // 1. Remove quotes (', ")
    let sanitized = name.replace(/['"]/g, '');

    // 2. If it is the English field, strip all Khmer diacritics/signs (U+17B6-U+17D3)
    if (isEnglishField) {
      return sanitized.replace(/[\u17b6-\u17d3]/g, '');
    }

    // 3. For Khmer field: Remove diacritics (U+17B6-U+17D3)
    //    only if they are NOT immediately preceded by a Khmer consonant (U+1780-U+17A2)
    return sanitized.replace(/(?<![\u1780-\u17a2])[\u17b6-\u17d3]+/g, '');
  }

  async create(createRegistrationDto: CreateRegistrationDto) {
    await this.prisma.registration.create({
      data: {
        name_en: this.sanitizeName(createRegistrationDto.name_en, true),
        name_kh: createRegistrationDto.name_kh ? this.sanitizeName(createRegistrationDto.name_kh, false) : '',
        entity_code: createRegistrationDto.entity_code,
      },
    });
    return { message: 'Successfully!' };
  }

  async bulkCreate(bulkCreateRegistrationDto: BulkCreateRegistrationDto) {
    const data = bulkCreateRegistrationDto.data.map((item) => ({
      name_en: this.sanitizeName(item.name_en, true),
      name_kh: item.name_kh ? this.sanitizeName(item.name_kh, false) : '',
      entity_code: item.entity_code,
    }));

    if (data.length > MAX_IMPORT_ROWS) {
      throw new BadRequestException(
        `Import limit exceeded. You can import up to ${MAX_IMPORT_ROWS} rows at a time.`,
      );
    }

    for (let index = 0; index < data.length; index += BULK_IMPORT_BATCH_SIZE) {
      const batch = data.slice(index, index + BULK_IMPORT_BATCH_SIZE);

      await this.prisma.registration.createMany({
        data: batch,
      });
    }

    return { message: 'Import Successfully!' };
  }

  async updateBySlug(slug: string, updateRegistrationDto: UpdateRegistrationDto) {
    const registration = await this.prisma.registration.findUnique({
      where: { slug },
    });

    if (!registration) {
      throw new NotFoundException(`Registration with slug ${slug} not found`);
    }

    await this.prisma.registration.update({
      where: { slug },
      data: {
        name_en: updateRegistrationDto.name_en,
        name_kh: updateRegistrationDto.name_kh,
        entity_code: updateRegistrationDto.entity_code,
      },
    });

    return { message: 'Update Successfully!' };
  }

  async deleteBySlug(slug: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { slug },
    });

    if (!registration) {
      throw new NotFoundException(`Registration with slug ${slug} not found`);
    }

    await this.prisma.registration.delete({
      where: { slug },
    });

    return { message: 'Delete Successfully!' };
  }

  async search(
    query: string,
    isAuthorized: boolean,
    page = 1,
    limit = 10,
    sortOrder: 'asc' | 'desc' = 'asc',
  ) {
    const rawQuery = query.toLowerCase().trim();
    const sanitizedQuery = query.toLowerCase().replace(/[\s,.]/g, '');
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0
      ? Math.min(Math.floor(limit), 50)
      : 10;
    const skip = (safePage - 1) * safeLimit;
    const direction = sortOrder === 'desc' ? 'DESC' : 'ASC';

    // If query is empty, return all registrations (or a limited set)
    if (!sanitizedQuery) {
      const [data, total] = await this.prisma.$transaction([
        this.prisma.registration.findMany({
          skip,
          take: safeLimit,
          orderBy: { created_at: 'desc' },
          select: {
            name_en: true,
            name_kh: isAuthorized,
            entity_code: true,
            created_at: true,
            slug: true,
          },
        }),
        this.prisma.registration.count(),
      ]);

      return {
        data,
        total,
        page: safePage,
        limit: safeLimit,
      };
    }

    const countRows = await this.prisma.$queryRawUnsafe<Array<{ total: bigint | number }>>(`
      SELECT COUNT(*) AS total
      FROM registrations
      WHERE LOWER(name_en) LIKE ?
         OR LOWER(name_kh) LIKE ?
         OR LOWER(entity_code) LIKE ?
         OR LOWER(REPLACE(REPLACE(REPLACE(name_en, ' ', ''), '.', ''), ',', '')) LIKE ?
         OR LOWER(REPLACE(REPLACE(REPLACE(name_kh, ' ', ''), '.', ''), ',', '')) LIKE ?
         OR LOWER(entity_code) LIKE ?
    `,
      `%${rawQuery}%`,
      `%${rawQuery}%`,
      `%${rawQuery}%`,
      `%${sanitizedQuery}%`,
      `%${sanitizedQuery}%`,
      `%${sanitizedQuery}%`,
    );

    const results = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT name_en, name_kh, entity_code, created_at, slug
      FROM registrations 
      WHERE LOWER(name_en) LIKE ?
         OR LOWER(name_kh) LIKE ?
         OR LOWER(entity_code) LIKE ?
         OR LOWER(REPLACE(REPLACE(REPLACE(name_en, ' ', ''), '.', ''), ',', '')) LIKE ?
         OR LOWER(REPLACE(REPLACE(REPLACE(name_kh, ' ', ''), '.', ''), ',', '')) LIKE ?
         OR LOWER(entity_code) LIKE ?
      ORDER BY 
        (LOWER(name_en) = ?) DESC,
        (LOWER(name_kh) = ?) DESC,
        (LOWER(name_en) LIKE ?) DESC,
        (LOWER(name_kh) LIKE ?) DESC,
        (LOWER(name_en) LIKE ?) DESC,
        (LOWER(name_kh) LIKE ?) DESC,
        (LOWER(REPLACE(REPLACE(REPLACE(name_en, ' ', ''), '.', ''), ',', '')) LIKE ?) DESC,
        (LOWER(entity_code) LIKE ?) DESC,
        LOWER(name_en) ${direction}
      LIMIT ? OFFSET ?
    `,
      `%${rawQuery}%`,
      `%${rawQuery}%`,
      `%${rawQuery}%`,
      `%${sanitizedQuery}%`,
      `%${sanitizedQuery}%`,
      `%${sanitizedQuery}%`,
      rawQuery,
      rawQuery,
      `${rawQuery}%`,
      `${rawQuery}%`,
      `%${rawQuery}%`,
      `%${rawQuery}%`,
      `%${sanitizedQuery}%`,
      `%${rawQuery}%`,
      safeLimit,
      skip,
    );

    return {
      data: results,
      total: Number(countRows[0]?.total || 0),
      page: safePage,
      limit: safeLimit,
    };
  }

}
