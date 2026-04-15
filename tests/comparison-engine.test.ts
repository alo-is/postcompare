// tests/comparison-engine.test.ts
import { describe, it, expect } from 'vitest';
import { compare } from '../src/lib/comparison-engine';
import type { OperatorData, SearchParams, ComparisonResult } from '../src/lib/types';

// Minimal test fixtures
const laPoste: OperatorData = {
  operator: {
    id: 'la-poste-fr',
    name: 'La Poste',
    country: 'FR',
    currency: 'EUR',
    website: 'https://www.laposte.fr',
    logo: 'la-poste-fr.svg',
    last_updated: '2026-04-01',
  },
  letters: {
    domestic: [
      { name: 'Lettre verte', max_weight_g: 20, price_eur: 1.29, delivery_days: [2, 4] },
      { name: 'Lettre verte', max_weight_g: 100, price_eur: 2.58, delivery_days: [2, 4] },
    ],
    international: {
      zones: [
        {
          name: 'Europe',
          countries: ['DE', 'ES', 'GB'],
          rates: [
            { name: 'Lettre internationale', max_weight_g: 20, price_eur: 1.80, delivery_days: [3, 7] },
            { name: 'Lettre internationale', max_weight_g: 100, price_eur: 3.60, delivery_days: [3, 7] },
          ],
        },
      ],
    },
  },
  parcels: {
    domestic: [
      { name: 'Colissimo', max_weight_kg: 1, price_eur: 6.40, delivery_days: [2, 3], tracking: true },
      { name: 'Colissimo', max_weight_kg: 5, price_eur: 8.95, delivery_days: [2, 3], tracking: true },
    ],
    international: {
      zones: [
        {
          name: 'Europe',
          countries: ['DE', 'ES', 'GB'],
          rates: [
            { name: 'Colissimo International', max_weight_kg: 1, price_eur: 9.50, delivery_days: [3, 5], tracking: true },
            { name: 'Colissimo International', max_weight_kg: 5, price_eur: 18.50, delivery_days: [3, 5], tracking: true },
          ],
        },
      ],
    },
  },
};

const deutschePost: OperatorData = {
  operator: {
    id: 'deutsche-post-de',
    name: 'Deutsche Post',
    country: 'DE',
    currency: 'EUR',
    website: 'https://www.deutschepost.de',
    logo: 'deutsche-post-de.svg',
    last_updated: '2026-04-01',
  },
  letters: {
    domestic: [
      { name: 'Standardbrief', max_weight_g: 20, price_eur: 0.95, delivery_days: [1, 2] },
      { name: 'Großbrief', max_weight_g: 500, price_eur: 1.80, delivery_days: [1, 2] },
    ],
    international: {
      zones: [
        {
          name: 'Europe',
          countries: ['FR', 'ES', 'GB'],
          rates: [
            { name: 'Standardbrief International', max_weight_g: 20, price_eur: 1.10, delivery_days: [2, 5] },
            { name: 'Großbrief International', max_weight_g: 500, price_eur: 3.70, delivery_days: [2, 5] },
          ],
        },
      ],
    },
  },
  parcels: {
    domestic: [
      { name: 'DHL Paket', max_weight_kg: 5, price_eur: 6.99, delivery_days: [1, 2], tracking: true },
      { name: 'DHL Paket', max_weight_kg: 10, price_eur: 9.49, delivery_days: [1, 2], tracking: true },
    ],
    international: {
      zones: [
        {
          name: 'EU',
          countries: ['FR', 'ES'],
          rates: [
            { name: 'DHL Paket International', max_weight_kg: 5, price_eur: 13.99, delivery_days: [3, 7], tracking: true },
          ],
        },
        {
          name: 'Europe hors UE',
          countries: ['GB'],
          rates: [
            { name: 'DHL Paket International', max_weight_kg: 5, price_eur: 18.99, delivery_days: [4, 10], tracking: true },
          ],
        },
      ],
    },
  },
};

const operators = [laPoste, deutschePost];

describe('comparison engine', () => {
  describe('domestic letter comparison', () => {
    it('finds the correct domestic letter rate for a specific country', () => {
      const params: SearchParams = { type: 'letter', weight: 20, origin: 'FR', destination: 'domestic' };
      const results = compare(operators, params);

      expect(results).toHaveLength(1);
      expect(results[0].operator.id).toBe('la-poste-fr');
      expect(results[0].priceEur).toBe(1.29);
      expect(results[0].route.isDomestic).toBe(true);
    });

    it('compares domestic letter rates across all countries', () => {
      const params: SearchParams = { type: 'letter', weight: 20, origin: 'all', destination: 'domestic' };
      const results = compare(operators, params);

      expect(results).toHaveLength(2);
      // Sorted by price: Deutsche Post (0.95) < La Poste (1.29)
      expect(results[0].operator.id).toBe('deutsche-post-de');
      expect(results[0].priceEur).toBe(0.95);
      expect(results[0].isBestPrice).toBe(true);
      expect(results[1].operator.id).toBe('la-poste-fr');
      expect(results[1].priceEur).toBe(1.29);
      expect(results[1].isBestPrice).toBe(false);
    });
  });

  describe('international letter comparison', () => {
    it('finds the correct international rate for FR to DE', () => {
      const params: SearchParams = { type: 'letter', weight: 20, origin: 'FR', destination: 'DE' };
      const results = compare(operators, params);

      expect(results).toHaveLength(1);
      expect(results[0].operator.id).toBe('la-poste-fr');
      expect(results[0].priceEur).toBe(1.80);
      expect(results[0].route.isDomestic).toBe(false);
    });

    it('shows rates from multiple operators when destination is reachable', () => {
      const params: SearchParams = { type: 'letter', weight: 20, origin: 'all', destination: 'ES' };
      const results = compare(operators, params);

      expect(results).toHaveLength(2);
      // Deutsche Post (1.10) < La Poste (1.80)
      expect(results[0].operator.id).toBe('deutsche-post-de');
      expect(results[0].priceEur).toBe(1.10);
      expect(results[1].operator.id).toBe('la-poste-fr');
      expect(results[1].priceEur).toBe(1.80);
    });
  });

  describe('weight tier matching', () => {
    it('finds the correct weight tier (smallest tier >= weight)', () => {
      const params: SearchParams = { type: 'letter', weight: 50, origin: 'FR', destination: 'domestic' };
      const results = compare(operators, params);

      expect(results).toHaveLength(1);
      expect(results[0].priceEur).toBe(2.58); // 100g tier
    });

    it('excludes operators when weight exceeds all tiers', () => {
      const params: SearchParams = { type: 'letter', weight: 300, origin: 'FR', destination: 'domestic' };
      const results = compare(operators, params);

      // La Poste max is 100g domestic, Deutsche Post max is 500g
      expect(results).toHaveLength(0);
    });

    it('handles exact weight match on tier boundary', () => {
      const params: SearchParams = { type: 'letter', weight: 100, origin: 'FR', destination: 'domestic' };
      const results = compare(operators, params);

      expect(results).toHaveLength(1);
      expect(results[0].priceEur).toBe(2.58); // exactly 100g tier
    });
  });

  describe('parcel comparison', () => {
    it('compares domestic parcel rates', () => {
      const params: SearchParams = { type: 'parcel', weight: 1, origin: 'all', destination: 'domestic' };
      const results = compare(operators, params);

      expect(results).toHaveLength(2);
      // Deutsche Post DHL Paket 5kg (6.99) > La Poste Colissimo 1kg (6.40)
      expect(results[0].operator.id).toBe('la-poste-fr');
      expect(results[0].priceEur).toBe(6.40);
    });

    it('handles international parcel with zone-based routing', () => {
      const params: SearchParams = { type: 'parcel', weight: 1, origin: 'DE', destination: 'GB' };
      const results = compare(operators, params);

      expect(results).toHaveLength(1);
      expect(results[0].operator.id).toBe('deutsche-post-de');
      expect(results[0].priceEur).toBe(18.99); // Europe hors UE zone
    });

    it('includes tracking info in results', () => {
      const params: SearchParams = { type: 'parcel', weight: 1, origin: 'FR', destination: 'domestic' };
      const results = compare(operators, params);

      expect(results[0].tracking).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('returns empty array when no operators cover the destination', () => {
      const params: SearchParams = { type: 'parcel', weight: 1, origin: 'FR', destination: 'JP' };
      const results = compare(operators, params);

      expect(results).toHaveLength(0);
    });

    it('handles origin=all with destination=specific correctly', () => {
      // When origin=all and destination=FR, Deutsche Post shows international,
      // La Poste shows domestic (origin=FR, dest=FR)
      const params: SearchParams = { type: 'letter', weight: 20, origin: 'all', destination: 'FR' };
      const results = compare(operators, params);

      // La Poste: origin=FR, dest=FR => domestic rate
      // Deutsche Post: origin=DE, dest=FR => international rate
      expect(results).toHaveLength(2);
    });
  });
});
