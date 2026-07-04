const { execSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

/** @type {{ version: string }} */
const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));

function normalizeReleaseVersion(raw) {
  return raw.trim().replace(/^v/i, '');
}

function readPackageVersion() {
  return packageJson.version;
}

function readLatestGitTag() {
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

function readAppVersion() {
  const fromEnv = process.env.FRESHY_RELEASE_VERSION?.trim();
  if (fromEnv) return normalizeReleaseVersion(fromEnv);

  const fromPackage = readPackageVersion();
  if (fromPackage) return fromPackage;

  return readLatestGitTag() ?? '0.0.0';
}

module.exports = { readAppVersion };
