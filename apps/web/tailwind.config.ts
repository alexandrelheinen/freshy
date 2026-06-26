import type { Config } from 'tailwindcss';
import freshyPreset from '@freshy/config/tailwind';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'],
  presets: [freshyPreset as unknown as Config],
  theme: { extend: {} },
  plugins: [],
};

export default config;
