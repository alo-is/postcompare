import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { OperatorData } from '../src/lib/types';

const operatorsDir = path.resolve(process.cwd(), 'data', 'operators');

function loadOperator(filename: string): OperatorData {
  return yaml.load(
    fs.readFileSync(path.join(operatorsDir, filename), 'utf-8'),
  ) as OperatorData;
}

function domesticRate(operator: OperatorData, maxWeightG: number) {
  return operator.letters.domestic.find((rate) => rate.max_weight_g === maxWeightG);
}

function internationalRate(
  operator: OperatorData,
  country: string,
  maxWeightG: number,
) {
  return operator.letters.international.zones
    .find((zone) => zone.countries.includes(country))
    ?.rates.find((rate) => rate.max_weight_g === maxWeightG);
}

describe('verified current postal rates', () => {
  it('uses bpost Europe priority letter rate up to 50g from the 2026 tariff', () => {
    const bpost = loadOperator('bpost-be.yaml');

    expect(internationalRate(bpost, 'FR', 50)?.price_eur).toBe(3.07);
    expect(bpost.operator.sources).toContainEqual(expect.objectContaining({
      url: 'https://www.bpost.be/fr/tarifs-particuliers',
      retrieved_at: '2026-08-10',
    }));
  });

  it('uses the verified PostNL EUR1 rates only for explicitly checked destinations', () => {
    const postnl = loadOperator('postnl-nl.yaml');

    for (const country of ['BE', 'DK', 'DE', 'FR', 'IT', 'LU', 'AT', 'ES', 'SE']) {
      expect([20, 50, 100, 350, 2000].map(
        (weight) => internationalRate(postnl, country, weight)?.price_eur,
      )).toEqual([2.11, 4.22, 6.33, 8.44, 10.55]);
    }
    expect(internationalRate(postnl, 'PT', 20)?.price_eur).toBe(1.90);
    expect(postnl.operator.sources).toContainEqual(expect.objectContaining({
      url: 'https://www.postnl.nl/en/sending/letter-or-card/international-mail/',
      effective_from: '2026-07-12',
    }));
  });

  it('uses Posti current domestic and international priority letter prices without inventing higher tiers', () => {
    const posti = loadOperator('posti-fi.yaml');

    expect(posti.letters.domestic.filter((rate) => rate.max_weight_g === 50))
      .toEqual([expect.objectContaining({ price_eur: 3.00 })]);
    expect(internationalRate(posti, 'FR', 20)?.price_eur).toBe(3.35);
    expect(posti.operator.sources).toContainEqual(expect.objectContaining({
      url: 'https://www.posti.fi/en/sending/letters-and-postcards/letter-price-lists',
      effective_from: '2026-06-02',
    }));
  });

  it('uses the converted Posten Norge Europe letter price up to 50g', () => {
    const posten = loadOperator('posten-norge-no.yaml');

    expect(internationalRate(posten, 'FR', 50)?.price_eur).toBe(3.15);
    expect(posten.operator.sources).toContainEqual(expect.objectContaining({
      url: 'https://www.posten.no/priser/utskriftsvennlige-prislister-2026/Priser-post-betalt-med-frimerker_01022026.pdf',
      effective_from: '2026-02-01',
    }));
  });

  it('marks all PostNord Denmark letter services unavailable', () => {
    const postnord = loadOperator('postnord-dk.yaml');

    expect(postnord.letters).toMatchObject({
      available: false,
      unavailable_since: '2026-01-01',
      notice: expect.any(Object),
    });
    expect(postnord.operator.sources).toEqual(expect.arrayContaining([{
      title: 'PostNord leverer sit sidste brev ved udgangen af 2025: Det betyder det for dig',
      url: 'https://www.postnord.dk/postnord-leverer-sit-sidste-brev-ved-udgangen-af-2025/',
      retrieved_at: '2026-08-10',
      effective_from: '2026-01-01',
    }]));
  });

  it('removes discontinued Poste Italiane Posta 1 services but keeps Postamail Internazionale', () => {
    const posteItaliane = loadOperator('poste-italiane-it.yaml');

    expect(posteItaliane.letters.domestic.some((rate) => rate.name.startsWith('Posta 1'))).toBe(false);
    expect(posteItaliane.letters.international.zones[0].rates.some(
      (rate) => rate.name === 'Postamail Internazionale',
    )).toBe(true);
    expect(posteItaliane.operator.sources).toContainEqual(expect.objectContaining({
      url: 'https://www.poste.it/variazione-servizio-postale-universale',
      effective_from: '2026-05-01',
    }));
  });

  it('uses the ELTA domestic A-priority small-letter rate up to 20g', () => {
    const elta = loadOperator('elta-gr.yaml');
    const rate = domesticRate(elta, 20);

    expect(rate).toEqual(expect.objectContaining({
      name: expect.stringContaining('προτεραιότητας'),
      price_eur: 2.20,
    }));
    expect(elta.operator.sources).toContainEqual(expect.objectContaining({
      url: 'https://e-stamp.elta.gr/',
      retrieved_at: '2026-08-10',
    }));
  });

  it('uses the Croatia domestic and international letter rates up to 50g and universal parcel tier up to 2kg', () => {
    const hrvatskaPosta = loadOperator('hrvatska-posta-hr.yaml');

    expect(domesticRate(hrvatskaPosta, 50)?.price_eur).toBe(0.72);
    expect(internationalRate(hrvatskaPosta, 'FR', 50)?.price_eur).toBe(1.70);
    expect(hrvatskaPosta.parcels.domestic.filter((rate) => rate.max_weight_kg <= 2))
      .toEqual([expect.objectContaining({ max_weight_kg: 2, price_eur: 5.96 })]);
    expect(hrvatskaPosta.operator.sources).toContainEqual(expect.objectContaining({
      url: 'https://www.posta.hr/UserDocsImages/hp/dokumenti/cjenici/2026/IZVADAK_IZ_CJENIKA_POSTANSKIH_USLUGA_U_UNUTARNJEM_PROMETU_1-5-26..pdf?vel=215700',
      effective_from: '2026-05-01',
    }));
    expect(hrvatskaPosta.operator.sources).toContainEqual(expect.objectContaining({
      url: 'https://www.posta.hr/UserDocsImages/hp/dokumenti/cjenici/2026/Izvadak_iz_cjenika_usluga_servisa_ePosta_1-5-26.pdf',
      effective_from: '2026-05-01',
    }));
  });

  it('uses the Lietuvos paštas domestic letter rate up to 50g', () => {
    const lietuvosPastas = loadOperator('lietuvos-pastas-lt.yaml');

    expect(domesticRate(lietuvosPastas, 50)?.price_eur).toBe(1.65);
    expect(lietuvosPastas.operator.sources).toContainEqual(expect.objectContaining({
      url: 'https://www.post.lt/lt/apie-mus/naujienos/nuo-2026-m-liepos-13-d-nauji-upp-tarifai-daugiau-prieinamumo-klientams',
      effective_from: '2026-07-13',
    }));
  });
});
