import { ExploreMapClient } from '../../components/ExploreMapClient';
import { fetchPlaces } from '../../lib/api';

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  const initialPlaces = await fetchPlaces({ radius: 3 });
  return <ExploreMapClient initialPlaces={initialPlaces} />;
}
