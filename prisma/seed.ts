import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';

const englishNames = [
  'Sokha Trading',
  'Angkor Digital',
  'Mekong Supply',
  'Lotus Market',
  'Bayon Services',
  'Phnom Penh Logistics',
  'Tonle Sap Foods',
  'Kampot Pepper House',
  'Siem Reap Tours',
  'Borei Construction',
];

const khmerNames = [
  'សុខា ត្រេឌីង',
  'អង្គរ ឌីជីថល',
  'មេគង្គ សាប់ផ្លាយ',
  'ផ្សារឈូក',
  'បាយ័ន សឺវីស',
  'ភ្នំពេញ ឡូជីស្ទិក',
  'ទន្លេសាប ហ្វូដ',
  'ផ្ទះម្រេចកំពត',
  'សៀមរាប ទេសចរណ៍',
  'បុរី សំណង់',
];

function createSeedRegistrations(): Array<{
  name_en: string;
  name_kh: string;
  entity_code: string;
}> {
  return Array.from({ length: 50 }, (_, index) => {
    const nameIndex = index % englishNames.length;
    const sequence = String(index + 1).padStart(2, '0');
    const leadingSegment = String(100 + index).padStart(index % 2 === 0 ? 3 : 4, '0');
    const middleSegment = String((index % 12) + 1).padStart(2, '0');
    const suffix = ['P', 'B', 'C'][index % 3];
    const trailingSegment =
      index % 5 === 0 ? `/${String((index % 9) + 1).padStart(2, '0')}` : '';

    return {
      name_en: `${englishNames[nameIndex]} ${sequence}`,
      name_kh: `${khmerNames[nameIndex]} ${sequence}`,
      entity_code: `${leadingSegment}/${middleSegment}/${suffix}${trailingSegment}`,
    };
  });
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to seed the database.');
  }

  const adapter = new PrismaMariaDb(databaseUrl);
  const prisma = new PrismaClient({ adapter });
  const registrations = createSeedRegistrations();

  await prisma.registration.deleteMany();

  await prisma.$transaction(
    registrations.map((registration) =>
      prisma.registration.create({
        data: registration,
      }),
    ),
  );

  console.log(`Seeded ${registrations.length} registrations.`);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: await bcrypt.hash('admin123', 10),
      fullname: 'Administrator',
    },
    create: {
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      fullname: 'Administrator',
    },
  });

  console.log('Seeded admin user.');

  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
