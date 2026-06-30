import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { findLiteralColorViolations } from './check-no-literal-colors';
import { assertContrastPairs } from './contrast';
import { loadTheme } from './compile-themes';

const packageRoot = path.resolve(__dirname, '..');

function main(): void {
  const defaultTheme = loadTheme('default');
  const contrastFailures = assertContrastPairs(defaultTheme.colors);
  if (contrastFailures.length > 0) {
    console.error('Contrast validation failed:');
    for (const failure of contrastFailures) {
      console.error(`  - ${failure}`);
    }
    process.exit(1);
  }

  const violations = findLiteralColorViolations();
  if (violations.length > 0) {
    console.error('Literal color gate failed:');
    for (const violation of violations) {
      console.error(`  ${violation.file}:${violation.line} [${violation.name}]`);
    }
    process.exit(1);
  }

  execFileSync(
    process.execPath,
    [
      '--import',
      'tsx',
      '--test',
      path.join(packageRoot, 'compiler/compile-themes.test.ts'),
      path.join(packageRoot, 'compiler/contrast.test.ts'),
      path.join(packageRoot, 'compiler/parity.test.ts'),
    ],
    { stdio: 'inherit', cwd: packageRoot },
  );

  console.log('Theme validation passed.');
}

main();
