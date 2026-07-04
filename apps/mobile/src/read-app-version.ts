import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageJson = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8'),
) as { version: string };

function normalizeReleaseVersion(raw: string): string {
  return raw.trim().replace(/^v/i, '');
}

function readPackageVersion(): string {
  return packageJson.version;
}

function readLatestGitTag(): string | null {
  try {
    const tag = execSync('git describe --tags --abbrev=0', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return tag ? normalizeReleaseVersion(tag) : null;
  } catch {
    return null;
  }
}

export function readAppVersion(): string {
  const fromEnv = process.env.FRESHY_RELEASE_VERSION?.trim();
  if (fromEnv) return normalizeReleaseVersion(fromEnv);

  const fromPackage = readPackageVersion();
  if (fromPackage) return fromPackage;

  return readLatestGitTag() ?? '0.0.0';
}
