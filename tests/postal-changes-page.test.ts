import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

function page(pathname: string): string {
  const file = path.join(DIST_DIR, pathname, 'index.html');
  expect(fs.existsSync(file), `missing generated page: /${pathname}/`).toBe(true);
  return fs.readFileSync(file, 'utf-8');
}

function generatedStyles(): string {
  const assets = path.join(DIST_DIR, '_astro');
  return fs.readdirSync(assets)
    .filter((file) => file.endsWith('.css'))
    .map((file) => fs.readFileSync(path.join(assets, file), 'utf-8'))
    .join('\n');
}

beforeAll(() => {
  execFileSync(path.join(process.cwd(), 'node_modules/.bin/astro'), ['build'], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });
});

describe('2027 postal-change public pages', () => {
  it('generates the postal bulletin in all three locales with confirmed and preview notices', () => {
    const fr = page('fr/tarifs-2027');
    const en = page('en/tarifs-2027');
    const de = page('de/tarifs-2027');

    expect(fr).toContain('Tarifs postaux 2027');
    expect(en).toContain('2027 postal changes');
    expect(de).toContain('Posttarife 2027');
    expect(fr).toContain('celui-ci continue d’afficher les tarifs actuellement publiés.');
    expect(en).toContain('it continues to show currently published rates.');
    expect(de).toContain('Er zeigt weiterhin die aktuell veröffentlichten Tarife.');
    for (const html of [fr, en, de]) {
      expect(html).toContain('2027-01-01');
      expect(html).toMatch(/confirmed|confirmé|bestätigt/i);
      expect(html).toMatch(/preview|aperçu|vorschau/i);
      expect(html).toContain('laposte.fr/tarifs-postaux-courrier-lettres-timbres-2027');
      expect(html).toContain('deutschepost.de/de/b/briefe-ins-ausland');
    }
  });

  it('links the homepage teaser, navigation, and affected operators to the localized bulletin', () => {
    for (const lang of ['fr', 'en', 'de']) {
      const home = page(lang);
      const france = page(`${lang}/operator/la-poste-fr`);
      const germany = page(`${lang}/operator/deutsche-post-de`);
      const denmark = page(`${lang}/operator/postnord-dk`);
      const belgium = page(`${lang}/operator/bpost-be`);

      expect(home).toContain(`href="/${lang}/tarifs-2027"`);
      expect(france).toContain(`href="/${lang}/tarifs-2027"`);
      expect(germany).toContain(`href="/${lang}/tarifs-2027"`);
      expect(denmark).toContain(`href="/${lang}/tarifs-2027"`);
      expect(france).toContain('operator-postal-alert');
      expect(germany).toContain('operator-postal-alert');
      expect(denmark).toContain('operator-postal-alert');
      expect(belgium).not.toContain('operator-postal-alert');
    }
  });

  it('shows a PostNord letter-service notice instead of letter prices and renders current-rate sources', () => {
    const denmark = page('en/operator/postnord-dk');
    const belgium = page('en/operator/bpost-be');

    expect(denmark).toContain('PostNord letter services are no longer available in Denmark.');
    expect(denmark).not.toContain('from 3.08 EUR');
    expect(denmark).not.toContain('Brev (dao)');
    expect(belgium).toContain('Current rate sources');
    expect(belgium).toContain('bpost.be');
  });

  it('aligns the generated bulletin timeline on one desktop grid without offset padding', () => {
    const styles = generatedStyles();

    expect(styles).toMatch(/\.postal-timeline\{[^}]*grid-template-columns:9\.2rem minmax\(0,1fr\)/);
    expect(styles).toMatch(/\.postal-timeline\{[^}]*display:grid/);
    expect(styles).not.toMatch(/\.postal-timeline\{[^}]*padding-left:12rem/);
  });
});
