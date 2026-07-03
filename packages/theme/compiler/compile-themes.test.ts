import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { COLOR_ROLES, SHADOW_ROLES } from '../src/roles';
import { compileThemes, loadTheme, validateTheme } from './compile-themes';

const GENERATED_DIR = path.resolve(__dirname, '../generated');

describe('compile-themes', () => {
  it('compiles default theme artifacts', () => {
    const ids = compileThemes();
    assert.deepEqual(ids, ['default', 'dark']);
    assert.ok(fs.existsSync(path.join(GENERATED_DIR, 'default.css')));
    assert.ok(fs.existsSync(path.join(GENERATED_DIR, 'default.tokens.ts')));
    assert.ok(fs.existsSync(path.join(GENERATED_DIR, 'index.ts')));
    assert.ok(fs.existsSync(path.join(GENERATED_DIR, 'themes.css')));
  });

  it('writes CSS variables for every color role', () => {
    const css = fs.readFileSync(path.join(GENERATED_DIR, 'default.css'), 'utf8');
    for (const role of COLOR_ROLES) {
      assert.match(css, new RegExp(`--color-${role.replace(/-/g, '\\-')}:`));
    }
  });

  it('writes root and data-theme selectors for default', () => {
    const css = fs.readFileSync(path.join(GENERATED_DIR, 'default.css'), 'utf8');
    assert.match(css, /:root:not\(\[data-theme='dark'\]\)/);
    assert.match(css, /\[data-theme='default'\]/);
    assert.match(css, /--color-primary: #005f9d;/);
  });

  it('orders themes so dark variables are not overridden by default :root', () => {
    const themesCss = fs.readFileSync(path.join(GENERATED_DIR, 'themes.css'), 'utf8');
    const defaultIndex = themesCss.indexOf(":root:not([data-theme='dark'])");
    const darkIndex = themesCss.indexOf("[data-theme='dark']");
    assert.ok(defaultIndex >= 0);
    assert.ok(darkIndex > defaultIndex);
    assert.doesNotMatch(themesCss, /:root,\s*\n\[data-theme='default'\]/);
  });

  it('writes shadow and glass variables', () => {
    const css = fs.readFileSync(path.join(GENERATED_DIR, 'default.css'), 'utf8');
    assert.match(css, /--effect-glass-blur: 15px;/);
    for (const role of SHADOW_ROLES) {
      assert.match(css, new RegExp(`--shadow-${role}:`));
    }
  });

  it('writes logo font letter-spacing variable', () => {
    const css = fs.readFileSync(path.join(GENERATED_DIR, 'default.css'), 'utf8');
    assert.match(css, /--font-logo-letter-spacing: 0\.00em;/);
  });

  it('writes logo font baseline offset variable', () => {
    const css = fs.readFileSync(path.join(GENERATED_DIR, 'default.css'), 'utf8');
    assert.match(css, /--font-logo-offset-y: -0\.08em;/);
    const darkCss = fs.readFileSync(path.join(GENERATED_DIR, 'dark.css'), 'utf8');
    assert.match(darkCss, /--font-logo-offset-y: -0\.11em;/);
  });

  it('fails when a required color role is missing', () => {
    const theme = loadTheme('default');
    const broken = { ...theme.colors };
    delete (broken as Record<string, string>)['primary'];
    assert.throws(() => {
      validateTheme('broken', broken, theme.effects, theme.fonts);
    }, /missing color role: primary/);
  });
});
