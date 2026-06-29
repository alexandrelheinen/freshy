import { PrismaClient, PlaceCategory, AcStrength } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { email: 'lucas@freshy.app' },
    update: {},
    create: {
      email: 'lucas@freshy.app',
      displayName: 'Lucas Frescor',
      username: 'lucas_frescor',
      reliefPoints: 1250,
    },
  });

  const places = [
    {
      slug: 'arctic-brew-coffee',
      name: 'Arctic Brew Coffee',
      description: 'Minimalist café with strong AC and a quiet atmosphere.',
      category: PlaceCategory.CAFE,
      latitude: -23.5505,
      longitude: -46.6333,
      address: 'Downtown, São Paulo',
      aggregatedTemperatureC: 19,
      aggregatedAcStrength: AcStrength.FRIGID,
    },
    {
      slug: 'ice-coffee-central',
      name: 'Ice Coffee Central',
      description: 'The perfect refuge from urban heat.',
      category: PlaceCategory.CAFE,
      latitude: -23.551,
      longitude: -46.634,
      address: 'Historic Center',
      aggregatedTemperatureC: 19,
      aggregatedAcStrength: AcStrength.FRIGID,
    },
    {
      slug: 'biblioteca-central',
      name: 'Central Library',
      description: 'Spacious venue with consistent air conditioning.',
      category: PlaceCategory.LIBRARY,
      latitude: -23.549,
      longitude: -46.632,
      address: 'Historic Center',
      aggregatedTemperatureC: 20,
      aggregatedAcStrength: AcStrength.FRIGID,
    },
  ];

  for (const place of places) {
    await prisma.place.upsert({
      where: { slug: place.slug },
      update: place,
      create: place,
    });
  }

  console.log(`Seeded user ${demoUser.username} and ${places.length} places.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
