import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { BulkCreateRegistrationDto } from './dto/bulk-create-registration.dto';

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRegistrationDto: CreateRegistrationDto) {
    await this.prisma.registration.create({
      data: {
        name_en: createRegistrationDto.name_en,
        name_kh: createRegistrationDto.name_kh,
      },
    });
    return { message: 'Successfully!' };
  }

  async bulkCreate(bulkCreateRegistrationDto: BulkCreateRegistrationDto) {
    const data = bulkCreateRegistrationDto.data.map((item) => ({
      name_en: item.name_en,
      name_kh: item.name_kh,
    }));

    await this.prisma.registration.createMany({
      data,
    });

    return { message: 'Import successfully!' };
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

  async search(query: string, isAuthorized: boolean) {
    const sanitizedQuery = query.toLowerCase().replace(/[\s,.]/g, '');

    // If query is empty, return all registrations (or a limited set)
    if (!sanitizedQuery) {
      return this.prisma.registration.findMany({
        take: 100,
        select: {
          name_en: true,
          name_kh: isAuthorized,
          slug: true,
        },
      });
    }

    // Using REPLACE in raw SQL for "smart search"
    // We normalize the DB column by stripping spaces, dots, and commas on-the-fly.
    // We also add ORDER BY to prioritize results that START with the query.
    const results = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT name_en, name_kh, slug
      FROM registrations 
      WHERE LOWER(REPLACE(REPLACE(REPLACE(name_en, ' ', ''), '.', ''), ',', '')) LIKE ?
         OR LOWER(REPLACE(REPLACE(REPLACE(name_kh, ' ', ''), '.', ''), ',', '')) LIKE ?
      ORDER BY 
        (LOWER(REPLACE(REPLACE(REPLACE(name_en, ' ', ''), '.', ''), ',', '')) LIKE ?) DESC,
        (LOWER(REPLACE(REPLACE(REPLACE(name_kh, ' ', ''), '.', ''), ',', '')) LIKE ?) DESC,
        name_en ASC
    `, `%${sanitizedQuery}%`, `%${sanitizedQuery}%`, `${sanitizedQuery}%`, `${sanitizedQuery}%`);

    return results;
  }

}
