import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..');

const SCAN_ROOTS = [
  path.join(ROOT, 'apps/web/src'),
  path.join(ROOT, 'apps/mobile/app'),
  path.join(ROOT, 'apps/mobile/src'),
  path.join(ROOT, 'packages/ui/src'),
];

const EXTENSIONS = new Set(['.ts', '.tsx', '.css']);

const PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'hex color', regex: /#[0-9a-fA-F]{3,8}\b/ },
  { name: 'rgb/rgba/hsl', regex: /\b(?:rgba?|hsla?)\(/ },
  { name: 'arbitrary shadow color', regex: /shadow-\[[^\]]*(?:rgba?|#)/ },
  { name: 'text-white utility', regex: /\btext-white(?:\/|\b)/ },
  { name: 'bg-white utility', regex: /\bbg-white(?:\/|\b)/ },
  { name: 'border-white utility', regex: /\bborder-white(?:\/|\b)/ },
  { name: 'ring-white utility', regex: /\bring-white(?:\/|\b)/ },
];

function walk(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) {
    return files;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

export function findLiteralColorViolations(): Array<{
  file: string;
  line: number;
  name: string;
  text: string;
}> {
  const violations: Array<{ file: string; line: number; name: string; text: string }> = [];

  for (const root of SCAN_ROOTS) {
    for (const file of walk(root)) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((text, index) => {
        for (const pattern of PATTERNS) {
          if (pattern.regex.test(text)) {
            violations.push({
              file: path.relative(ROOT, file),
              line: index + 1,
              name: pattern.name,
              text: text.trim(),
            });
          }
        }
      });
    }
  }

  return violations;
}

if (require.main === module) {
  const violations = findLiteralColorViolations();
  if (violations.length > 0) {
    for (const violation of violations) {
      console.error(`${violation.file}:${violation.line} [${violation.name}] ${violation.text}`);
    }
    process.exit(1);
  }
  console.log('No literal color violations found.');
}
