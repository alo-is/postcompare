import { describe, expect, it } from 'vitest';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { loadAllOperators, loadPostalChanges } from '../src/lib/data-loader';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const postalChangeSchema = JSON.parse(fs.readFileSync(
  path.join(DATA_DIR, 'schema', 'postal-change.schema.json'),
  'utf-8',
));
const validatePostalChanges = ajv.compile(postalChangeSchema);

describe('2027 consumer postal changes', () => {
  const changes = loadPostalChanges();

  it('provides all translations for customer-facing announcements', () => {
    for (const announcement of changes.announcements) {
      for (const change of announcement.changes) {
        expect(change.product).toMatchObject({
          fr: expect.any(String),
          en: expect.any(String),
          de: expect.any(String),
        });
        expect(change.product.fr).not.toHaveLength(0);
        expect(change.product.en).not.toHaveLength(0);
        expect(change.product.de).not.toHaveLength(0);
      }
    }
  });

  it('limits this dataset to consumer announcements', () => {
    expect(changes.announcements).toHaveLength(3);
    expect(changes.announcements.every((announcement) => announcement.scope === 'consumer')).toBe(true);
  });

  it('references operators present in the operator dataset', () => {
    const operatorIds = new Set(loadAllOperators().map(({ operator }) => operator.id));

    for (const announcement of changes.announcements) {
      expect(operatorIds).toContain(announcement.operator_id);
    }
  });

  it('loads the consultation date for every announcement source', () => {
    expect(changes.announcements.map(({ source }) => source.retrieved_at)).toEqual([
      '2026-08-10',
      '2026-08-10',
      '2026-08-10',
    ]);
  });

  it('keeps published price changes arithmetically coherent', () => {
    const priceChanges = changes.announcements.flatMap((announcement) => announcement.changes)
      .filter((change) => change.type === 'price_change');

    expect(priceChanges).toHaveLength(6);
    for (const change of priceChanges) {
      expect(change.new_price_eur).toBeDefined();
      if (change.old_price_eur !== undefined) {
        expect(change.percentage_change).toBeDefined();
        expect(change.percentage_change).toBeCloseTo(
          ((change.new_price_eur! - change.old_price_eur) / change.old_price_eur) * 100,
          1,
        );
      } else {
        expect(change.percentage_change).toBeUndefined();
      }
    }
  });

  it('records the new international 20 g price without inventing a historical percentage', () => {
    const international20g = changes.announcements[0].changes.find(
      (change) => change.product.fr === 'Lettre internationale 20 g',
    );

    expect(international20g).toMatchObject({
      type: 'price_change',
      new_price_eur: 2.45,
    });
    expect(international20g?.old_price_eur).toBeUndefined();
    expect(international20g?.percentage_change).toBeUndefined();
  });

  it('rejects invalid scope, incomplete translations, and partial historical price changes', () => {
    const validData = yaml.load(fs.readFileSync(
      path.join(DATA_DIR, 'postal-changes-2027.yaml'),
      'utf-8',
    )) as { announcements: Array<Record<string, unknown>> };
    const invalidScope = structuredClone(validData);
    invalidScope.announcements[0].scope = 'enterprise';
    const incompleteTranslation = structuredClone(validData);
    const incompleteProduct = (incompleteTranslation.announcements[0].changes as Array<{ product: Record<string, string> }>)[0].product;
    delete incompleteProduct.de;
    const partialHistoricalPrice = structuredClone(validData);
    const firstPriceChange = (partialHistoricalPrice.announcements[0].changes as Array<Record<string, unknown>>)[0];
    delete firstPriceChange.percentage_change;

    expect(validatePostalChanges(invalidScope)).toBe(false);
    expect(validatePostalChanges(incompleteTranslation)).toBe(false);
    expect(validatePostalChanges(partialHistoricalPrice)).toBe(false);
  });

  it('requires a valid ISO consultation date on announcement sources', () => {
    const data = yaml.load(fs.readFileSync(
      path.join(DATA_DIR, 'postal-changes-2027.yaml'),
      'utf-8',
    )) as { announcements: Array<{ source: Record<string, unknown> }> };
    const withConsultationDate = structuredClone(data);
    withConsultationDate.announcements[0].source.retrieved_at = '2026-08-10';
    const missingConsultationDate = structuredClone(withConsultationDate);
    delete missingConsultationDate.announcements[0].source.retrieved_at;
    const invalidConsultationDate = structuredClone(withConsultationDate);
    invalidConsultationDate.announcements[0].source.retrieved_at = '2026-08-40';

    expect(validatePostalChanges(withConsultationDate)).toBe(true);
    expect(validatePostalChanges(missingConsultationDate)).toBe(false);
    expect(validatePostalChanges(invalidConsultationDate)).toBe(false);
  });

  it('loads the sourced France, Germany, and Denmark announcements with typed fields', () => {
    expect(changes.announcements).toEqual(expect.arrayContaining([
      expect.objectContaining({ country: 'FR', operator_id: 'la-poste-fr', status: 'confirmed', effective_date: '2027-01-01' }),
      expect.objectContaining({ country: 'DE', operator_id: 'deutsche-post-de', status: 'confirmed', effective_date: '2027-01-01' }),
      expect.objectContaining({ country: 'DK', operator_id: 'postnord-dk', status: 'preview', effective_date: null }),
    ]));
  });
});
