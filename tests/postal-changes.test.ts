import { describe, expect, it } from 'vitest';
import { loadAllOperators, loadPostalChanges } from '../src/lib/data-loader';

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

  it('references operators present in the operator dataset', () => {
    const operatorIds = new Set(loadAllOperators().map(({ operator }) => operator.id));

    for (const announcement of changes.announcements) {
      expect(operatorIds).toContain(announcement.operator_id);
    }
  });

  it('keeps published price changes arithmetically coherent', () => {
    const priceChanges = changes.announcements.flatMap((announcement) => announcement.changes)
      .filter((change) => change.type === 'price_change');

    expect(priceChanges).toHaveLength(5);
    for (const change of priceChanges) {
      expect(change.old_price_eur).toBeDefined();
      expect(change.new_price_eur).toBeDefined();
      expect(change.percentage_change).toBeDefined();
      expect(change.percentage_change).toBeCloseTo(
        ((change.new_price_eur! - change.old_price_eur!) / change.old_price_eur!) * 100,
        1,
      );
    }
  });

  it('loads the sourced France, Germany, and Denmark announcements with typed fields', () => {
    expect(changes.announcements).toEqual(expect.arrayContaining([
      expect.objectContaining({ country: 'FR', operator_id: 'la-poste-fr', status: 'confirmed', effective_date: '2027-01-01' }),
      expect.objectContaining({ country: 'DE', operator_id: 'deutsche-post-de', status: 'confirmed', effective_date: '2027-01-01' }),
      expect.objectContaining({ country: 'DK', operator_id: 'postnord-dk', status: 'preview', effective_date: null }),
    ]));
  });
});
