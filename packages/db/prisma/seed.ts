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
      description: 'Café minimalista com AC potente e ambiente silencioso.',
      category: PlaceCategory.CAFE,
      latitude: -23.5505,
      longitude: -46.6333,
      address: 'Centro, São Paulo',
      aggregatedTemperatureC: 19,
      aggregatedAcStrength: AcStrength.FRIGID,
    },
    {
      slug: 'ice-coffee-central',
      name: 'Ice Coffee Central',
      description: 'O refúgio perfeito para escapar do calor urbano.',
      category: PlaceCategory.CAFE,
      latitude: -23.551,
      longitude: -46.634,
      address: 'Centro Histórico',
      aggregatedTemperatureC: 19,
      aggregatedAcStrength: AcStrength.FRIGID,
    },
    {
      slug: 'biblioteca-central',
      name: 'Biblioteca Central',
      description: 'Espaço amplo com climatização constante.',
      category: PlaceCategory.LIBRARY,
      latitude: -23.549,
      longitude: -46.632,
      address: 'Centro Histórico',
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
