import { BRAND_NAME, ROUTES } from '@freshy/ui';

export type PlaceNotFoundCopy = {
  documentTitle: string;
  heading: string;
  message: string;
  backHref: string;
  backLabel: string;
  pageMarker: 'place-detail';
  showAppChrome: true;
};

/** Copy and chrome contract for an unknown or unloadable place slug. */
export function placeNotFoundCopy(message?: string): PlaceNotFoundCopy {
  return {
    documentTitle: `${BRAND_NAME} | Place not found`,
    heading: 'Place not found',
    message: message ?? 'Place not found.',
    backHref: ROUTES.explore,
    backLabel: 'Back to Explore',
    pageMarker: 'place-detail',
    showAppChrome: true,
  };
}
