import type { OperatorData, PostalChangesData } from '../../src/lib/types';

export function withAnnouncementCountryMismatch(
  changes: PostalChangesData,
): PostalChangesData {
  const fixture = structuredClone(changes);
  fixture.announcements[0].country = 'BE';
  return fixture;
}

export function withConfirmedAnnouncementWithoutDate(
  changes: PostalChangesData,
): PostalChangesData {
  const fixture = structuredClone(changes);
  fixture.announcements[0].status = 'confirmed';
  fixture.announcements[0].effective_date = null;
  return fixture;
}

export function withUnknownAnnouncementOperator(
  changes: PostalChangesData,
): PostalChangesData {
  const fixture = structuredClone(changes);
  fixture.announcements[0].operator_id = 'unknown-post';
  return fixture;
}

export function withIncoherentPercentage(
  changes: PostalChangesData,
): PostalChangesData {
  const fixture = structuredClone(changes);
  const priceChange = fixture.announcements[0].changes.find(
    (change) => change.type === 'price_change' && change.old_price_eur !== undefined,
  )!;
  priceChange.percentage_change = 99;
  return fixture;
}

export function withDecreasingSameProductPrice(
  operator: OperatorData,
): OperatorData {
  const fixture = structuredClone(operator);
  fixture.letters.domestic = [
    { name: 'Fixture letter', max_weight_g: 20, price_eur: 2, delivery_days: [2, 4] },
    { name: 'Fixture letter', max_weight_g: 100, price_eur: 1, delivery_days: [2, 4] },
  ];
  return fixture;
}

export function withUnsortedWeights(operator: OperatorData): OperatorData {
  const fixture = structuredClone(operator);
  fixture.parcels.domestic = [
    { name: 'Fixture parcel', max_weight_kg: 5, price_eur: 8, delivery_days: [2, 4], tracking: true },
    { name: 'Fixture parcel', max_weight_kg: 2, price_eur: 5, delivery_days: [2, 4], tracking: true },
  ];
  return fixture;
}
