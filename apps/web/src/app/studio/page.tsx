import type { Metadata } from 'next';
import { StudioPageShell } from '../../components/StudioPageShell';

export const metadata: Metadata = {
  title: 'Freshy | Place Management Studio',
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  return <StudioPageShell />;
}
