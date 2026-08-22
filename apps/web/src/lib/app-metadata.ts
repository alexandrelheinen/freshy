import type { Metadata } from 'next';
import { BRAND_TAGLINE, BRAND_TITLE } from '@freshy/ui';
import { APP_METADATA_ICONS } from './app-icons';

export const appMetadata: Metadata = {
  title: BRAND_TITLE,
  description: BRAND_TAGLINE,
  icons: APP_METADATA_ICONS,
};
