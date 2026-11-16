import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadPostalChanges } from '../src/lib/data-loader';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const consumerAnnouncements = loadPostalChanges().announcements
  .filter(({ scope }) => scope === 'consumer');
const confirmedConsumerCount = consumerAnnouncements
  .filter(({ status }) => status === 'confirmed').length;
const hasConsumerPreview = consumerAnnouncements.some(({ status }) => status === 'preview');
const consumerOperatorIds = new Set(consumerAnnouncements.map(({ operator_id }) => operator_id));
const lastVerified = consumerAnnouncements.map(({ source }) => source.retrieved_at).sort().at(-1)!;

function formatVerifiedDate(locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${lastVerified}T00:00:00Z`));
}

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
  it('generates the consumer postal bulletin in all three locales without an empty preview section', () => {
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
      if (hasConsumerPreview) {
        expect(html).toContain('id="preview-changes"');
      } else {
        expect(html).not.toContain('id="preview-changes"');
      }
      expect(html).toContain('laposte.fr/tarifs-postaux-courrier-lettres-timbres-2027');
      expect(html).toContain('deutschepost.de/de/a/aenderungen2027');
      expect(html).not.toContain('postnord.dk/en/business/prices-for-businesses/post2027');
      expect(html).not.toContain('Post 2027');
    }
  });

  it('shows the latest announcement verification date in each locale', () => {
    expect(page('fr/tarifs-2027')).toContain(`Dernière vérification : ${formatVerifiedDate('fr-FR')}`);
    expect(page('en/tarifs-2027')).toContain(`Last verified: ${formatVerifiedDate('en-GB')}`);
    expect(page('de/tarifs-2027')).toContain(`Zuletzt geprüft: ${formatVerifiedDate('de-DE')}`);
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
      expect(france).toContain('operator-postal-alert');
      expect(germany).toContain('operator-postal-alert');
      if (consumerOperatorIds.has('postnord-dk')) {
        expect(denmark).toContain('operator-postal-alert');
      } else {
        expect(denmark).not.toContain('operator-postal-alert');
      }
      if (consumerOperatorIds.has('bpost-be')) {
        expect(belgium).toContain('operator-postal-alert');
      } else {
        expect(belgium).not.toContain('operator-postal-alert');
      }
    }
  });

  it('shows a PostNord letter-service notice instead of letter prices and labels consulted update sources', () => {
    const denmark = page('en/operator/postnord-dk');
    const belgium = page('en/operator/bpost-be');

    expect(denmark).toContain('PostNord letter services are no longer available in Denmark.');
    expect(denmark).not.toContain('from 3.08 EUR');
    expect(denmark).not.toContain('Brev (dao)');
    expect(belgium).toContain('Sources consulted for updates');
    expect(belgium).toContain('bpost.be');
  });

  it('states the localized confirmed consumer count on each homepage', () => {
    expect(page('fr')).toContain(`${confirmedConsumerCount} annonces grand public confirmées`);
    expect(page('en')).toContain(`${confirmedConsumerCount} confirmed consumer announcements`);
    expect(page('de')).toContain(`${confirmedConsumerCount} bestätigte Verbraucherankündigungen`);
  });

  it('adds a localized methodology warning tied to the verification date', () => {
    expect(page('fr/tarifs-2027')).toContain(
      `L’absence d’annonce officielle trouvée au ${formatVerifiedDate('fr-FR')} ne garantit pas qu’aucun changement ultérieur ne sera publié.`,
    );
    expect(page('en/tarifs-2027')).toContain(
      `The absence of an official announcement found as of ${formatVerifiedDate('en-GB')} does not guarantee that no later change will be published.`,
    );
    expect(page('de/tarifs-2027')).toContain(
      `Dass bis zum ${formatVerifiedDate('de-DE')} keine offizielle Ankündigung gefunden wurde, garantiert nicht, dass später keine Änderung veröffentlicht wird.`,
    );
  });

  it('aligns the generated bulletin timeline on one desktop grid without offset padding', () => {
    const styles = generatedStyles();

    expect(styles).toMatch(/\.postal-timeline\{[^}]*grid-template-columns:9\.2rem minmax\(0,1fr\)/);
    expect(styles).toMatch(/\.postal-timeline\{[^}]*display:grid/);
    expect(styles).not.toMatch(/\.postal-timeline\{[^}]*padding-left:12rem/);
  });
});
