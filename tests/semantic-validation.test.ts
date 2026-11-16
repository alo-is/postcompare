import { describe, expect, it } from 'vitest';
import { loadAllOperators, loadPostalChanges } from '../src/lib/data-loader';
import {
  classifyOperatorRateListIssues,
  classifySemanticIssues,
  validateOperatorRateLists,
  validatePostalChangeSemantics,
} from '../src/lib/data-validation';
import {
  withAnnouncementCountryMismatch,
  withConfirmedAnnouncementWithoutDate,
  withDecreasingSameProductPrice,
  withIncoherentPercentage,
  withUnknownAnnouncementOperator,
  withUnsortedWeights,
} from './fixtures/semantic-validation';

describe('semantic data validation', () => {
  const operators = loadAllOperators();
  const changes = loadPostalChanges();
  const posti = operators.find(({ operator }) => operator.id === 'posti-fi')!;

  it('rejects an announcement whose country differs from its operator country', () => {
    expect(validatePostalChangeSemantics(
      withAnnouncementCountryMismatch(changes),
      operators,
    )).toContain(
      'postal-changes-2027.yaml: la-poste-fr country BE does not match operator country FR',
    );
  });

  it('rejects a confirmed announcement without an effective date', () => {
    expect(validatePostalChangeSemantics(
      withConfirmedAnnouncementWithoutDate(changes),
      operators,
    )).toContain(
      'postal-changes-2027.yaml: confirmed announcement la-poste-fr requires an effective date',
    );
  });

  it('blocks success when an announcement references an unknown operator', () => {
    const issues = classifySemanticIssues(
      withUnknownAnnouncementOperator(changes),
      operators,
    );

    expect(issues.errors).toContain(
      'postal-changes-2027.yaml: unknown operator unknown-post',
    );
    expect(issues.canReportSuccess).toBe(false);
  });

  it('blocks success when a price change has an incoherent percentage', () => {
    const issues = classifySemanticIssues(
      withIncoherentPercentage(changes),
      operators,
    );

    expect(issues.errors).toContain(
      'postal-changes-2027.yaml: incoherent percentage for Green letter 20 g',
    );
    expect(issues.canReportSuccess).toBe(false);
  });

  it('rejects a decreasing price across increasing weights for one product', () => {
    expect(validateOperatorRateLists(withDecreasingSameProductPrice(posti))).toContain(
      'posti-fi.yaml: letters.domestic Fixture letter price decreases from 2 to 1 as weight increases',
    );
  });

  it('rejects a rate array whose maximum weights are not ordered', () => {
    expect(validateOperatorRateLists(withUnsortedWeights(posti))).toContain(
      'posti-fi.yaml: parcels.domestic weights must be non-decreasing',
    );
  });

  it('keeps competing products independent and permits equal maximum weights', () => {
    const fixture = structuredClone(posti);
    fixture.letters.domestic = [
      { name: 'Economy', max_weight_g: 50, price_eur: 3, delivery_days: [2, 4] },
      { name: 'Priority', max_weight_g: 50, price_eur: 2, delivery_days: [1, 2] },
      { name: 'Economy', max_weight_g: 250, price_eur: 6, delivery_days: [2, 4] },
    ];

    expect(validateOperatorRateLists(fixture)).toEqual([]);
  });

  it('blocks a new rate-list violation even when the operator has no sources', () => {
    const fixture = withDecreasingSameProductPrice(posti);
    delete fixture.operator.sources;

    expect(classifyOperatorRateListIssues([fixture])).toEqual({
      errors: [
        'posti-fi.yaml: letters.domestic Fixture letter price decreases from 2 to 1 as weight increases',
      ],
      warnings: [],
    });
  });

  it('classifies only the three exact legacy dataset violations as warnings', () => {
    expect(classifyOperatorRateListIssues(operators)).toEqual({
      errors: [],
      warnings: [
        'ceska-posta-cz.yaml: letters.international.Europe Dopis do zahraničí price decreases from 2 to 1.8 as weight increases',
        'correos-es.yaml: parcels.domestic weights must be non-decreasing',
        'royal-mail-gb.yaml: parcels.domestic weights must be non-decreasing',
      ],
    });
  });
});
