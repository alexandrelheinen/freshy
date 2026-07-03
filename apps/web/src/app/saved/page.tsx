import { redirect } from 'next/navigation';
import { ROUTES } from '@freshy/ui';

/** Saved places list is out of scope for the MVP; saving still works from place detail. */
export default function SavedPage() {
  redirect(ROUTES.explore);
}
