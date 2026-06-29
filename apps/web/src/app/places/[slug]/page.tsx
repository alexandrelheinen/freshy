import { PlaceDetailClient } from '../../../components/PlaceDetailClient';
import { PLACE_SLUGS } from '../../../lib/place-slugs';

export function generateStaticParams() {
  return PLACE_SLUGS.map((slug) => ({ slug }));
}

export default async function PlaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PlaceDetailClient slug={slug} />;
}
