#!/usr/bin/env node
/**
 * Rasterize apps/web/public/favicon.svg into the PNG and ICO sizes Next.js serves.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'apps/web/public');
const svg = readFileSync(join(publicDir, 'favicon.svg'));

function pngToIco(png) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0);
  entry.writeUInt8(32, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, png]);
}

const iconPng = await sharp(svg).resize(32, 32).png().toBuffer();
const applePng = await sharp(svg).resize(180, 180).png().toBuffer();

writeFileSync(join(publicDir, 'icon.png'), iconPng);
writeFileSync(join(publicDir, 'apple-touch-icon.png'), applePng);
writeFileSync(join(publicDir, 'favicon.ico'), pngToIco(iconPng));

console.log('Wrote icon.png, apple-touch-icon.png, and favicon.ico from favicon.svg');
