import { ALL_PLACE_CATEGORIES } from '@freshy/ui';
import { CategoryPlacesClient } from '../../../components/CategoryPlacesClient';

export function generateStaticParams() {
  return ALL_PLACE_CATEGORIES.map((category) => ({
    category: category.toLowerCase(),
  }));
}

export default async function CategoryPlacesPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return <CategoryPlacesClient categorySlug={category} />;
}
