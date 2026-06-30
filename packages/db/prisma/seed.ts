import { PrismaClient, PlaceCategory, AcStrength } from '@prisma/client';
import { PILOT_CITY } from '../src/geo';

const prisma = new PrismaClient();

const CATEGORY_AMENITIES: Record<PlaceCategory, string[]> = {
  [PlaceCategory.CAFE]: ['FREE_WIFI', 'COMFY_SEATING'],
  [PlaceCategory.RESTAURANT]: ['COMFY_SEATING', 'FREE_WATER'],
  [PlaceCategory.LIBRARY]: ['QUIET_ZONE', 'FREE_WIFI', 'POWER_OUTLETS'],
  [PlaceCategory.MALL]: ['FREE_WIFI', 'COMFY_SEATING'],
  [PlaceCategory.MUSEUM]: ['QUIET_ZONE', 'COMFY_SEATING'],
  [PlaceCategory.COWORKING]: ['FREE_WIFI', 'POWER_OUTLETS', 'LAPTOP_SPACE'],
  [PlaceCategory.PUBLIC_SPACE]: ['COMFY_SEATING', 'FREE_WATER'],
};

const VENUE_NAMES: Record<PlaceCategory, string[]> = {
  [PlaceCategory.CAFE]: [
    'Arctic Brew Coffee',
    'Ice Coffee Central',
    'Cool Bean Roasters',
    'Frostbite Espresso',
    'Glacier Grind',
    'Polar Pour',
    'Chill Cup Café',
    'Breeze & Beans',
    'Snowflake Bakery',
    'Cold Brew Corner',
  ],
  [PlaceCategory.RESTAURANT]: [
    'Frost Garden Bistro',
    'Arctic Plate Kitchen',
    'Cool Breeze Dining',
    'Glacier Grill',
    'Chilled Table',
    'Polar Feast',
    'Icebox Eatery',
    'Fresh Air Restaurant',
    'Summit Dining',
    'Northwind Kitchen',
  ],
  [PlaceCategory.LIBRARY]: [
    'Central Library',
    'Cool Reading Hall',
    'Arctic Archives',
    'Quiet Zone Library',
    'Metro Study Center',
    'Frost Page Library',
    'Climate Control Books',
    'Downtown Library Hub',
  ],
  [PlaceCategory.MALL]: [
    'Glacier Shopping Center',
    'Cool Air Mall',
    'Polar Plaza',
    'Frostbite Market',
    'Arctic Avenue Mall',
  ],
  [PlaceCategory.MUSEUM]: [
    'Cool Culture Museum',
    'Arctic Art Gallery',
    'Climate History Museum',
    'Frozen Frames Gallery',
    'Metro Museum of Cool',
  ],
  [PlaceCategory.COWORKING]: [
    'Innovation Hub',
    'Cool Desk Coworking',
    'Arctic Office Space',
    'Breeze Work Lounge',
    'Polar Productivity Lab',
    'Frost Workspace',
    'Chill Zone Coworking',
  ],
  [PlaceCategory.PUBLIC_SPACE]: [
    'Shaded Civic Plaza',
    'Cool Park Pavilion',
    'Arctic Community Center',
    'Metro Relief Station',
    'Public Chill Garden',
  ],
};

const DESCRIPTIONS = [
  'Strong air conditioning and a quiet atmosphere.',
  'Reliable cooling — popular during heat waves.',
  'Spacious interior with consistent climate control.',
  'The perfect refuge from urban heat.',
  'Comfortable seating and powerful AC.',
];

const STREETS = [
  'Rue Martre',
  'Rue de Paris',
  'Bd Jean Jaurès',
  'Rue de l\'Ancienne Mairie',
  'Rue Villeneuve',
  'Rue Claude Monet',
  'Rue Buffon',
  'Avenue Anatole France',
  'Rue de l\'Église',
  'Place de la République',
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Pseudo-random offset in km for seed coordinates around pilot center. */
function offsetCoordinate(index: number, axis: 'lat' | 'lng'): number {
  const base = axis === 'lat' ? PILOT_CITY.latitude : PILOT_CITY.longitude;
  const kmSpread = 1.8;
  const angle = (index * 137.508) * (Math.PI / 180);
  const distanceKm = ((index % 17) + 1) * (kmSpread / 17);
  const delta =
    axis === 'lat'
      ? (distanceKm / 111) * Math.cos(angle)
      : (distanceKm / (111 * Math.cos((PILOT_CITY.latitude * Math.PI) / 180))) * Math.sin(angle);
  return base + delta;
}

function pickAcStrength(index: number): AcStrength {
  const options = [AcStrength.LIGHTLY_COOLED, AcStrength.COMFORTABLE, AcStrength.FRIGID];
  return options[index % options.length] ?? AcStrength.COMFORTABLE;
}

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

  let index = 0;
  const places: Array<{
    slug: string;
    name: string;
    description: string;
    category: PlaceCategory;
    latitude: number;
    longitude: number;
    address: string;
    aggregatedTemperatureC: number;
    aggregatedAcStrength: AcStrength;
    amenities: string[];
  }> = [];

  for (const category of Object.values(PlaceCategory)) {
    for (const name of VENUE_NAMES[category]) {
      const slug = slugify(name);
      const ac = pickAcStrength(index);
      const temp =
        ac === AcStrength.FRIGID ? 18 + (index % 3) : ac === AcStrength.COMFORTABLE ? 21 + (index % 3) : 24 + (index % 2);

      places.push({
        slug,
        name,
        description: DESCRIPTIONS[index % DESCRIPTIONS.length] ?? DESCRIPTIONS[0]!,
        category,
        latitude: offsetCoordinate(index, 'lat'),
        longitude: offsetCoordinate(index, 'lng'),
        address: `${STREETS[index % STREETS.length]}, ${PILOT_CITY.postalCode} ${PILOT_CITY.name}`,
        aggregatedTemperatureC: temp,
        aggregatedAcStrength: ac,
        amenities: CATEGORY_AMENITIES[category],
      });
      index += 1;
    }
  }

  for (const place of places) {
    await prisma.place.upsert({
      where: { slug: place.slug },
      update: place,
      create: place,
    });
  }

  console.log(`Seeded user ${demoUser.username} and ${places.length} places in ${PILOT_CITY.name}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
