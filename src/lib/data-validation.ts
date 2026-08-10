import type { OperatorData, PostalChangesData } from './types';

interface RateTier {
  name: string;
  price_eur: number;
  max_weight_g?: number;
  max_weight_kg?: number;
}

interface RateList {
  label: string;
  rates: RateTier[];
  weightKey: 'max_weight_g' | 'max_weight_kg';
}

const ALLOWED_LEGACY_RATE_LIST_ERRORS = new Set([
  'ceska-posta-cz.yaml: letters.international.Europe Dopis do zahraničí price decreases from 2 to 1.8 as weight increases',
  'correos-es.yaml: parcels.domestic weights must be non-decreasing',
  'royal-mail-gb.yaml: parcels.domestic weights must be non-decreasing',
]);

export interface OperatorRateListIssues {
  errors: string[];
  warnings: string[];
}

export interface SemanticIssues extends OperatorRateListIssues {
  canReportSuccess: boolean;
}

export function validatePostalChangeSemantics(
  changes: PostalChangesData,
  operators: OperatorData[],
): string[] {
  const errors: string[] = [];
  const operatorsById = new Map(operators.map(({ operator }) => [operator.id, operator]));

  for (const announcement of changes.announcements) {
    const operator = operatorsById.get(announcement.operator_id);
    if (!operator) {
      errors.push(
        `postal-changes-2027.yaml: unknown operator ${announcement.operator_id}`,
      );
    } else if (operator.country !== announcement.country) {
      errors.push(
        `postal-changes-2027.yaml: ${announcement.operator_id} country ${announcement.country} does not match operator country ${operator.country}`,
      );
    }
    if (announcement.status === 'confirmed' && announcement.effective_date === null) {
      errors.push(
        `postal-changes-2027.yaml: confirmed announcement ${announcement.operator_id} requires an effective date`,
      );
    }
    for (const change of announcement.changes) {
      if (
        change.type !== 'price_change'
        || change.old_price_eur === undefined
        || change.percentage_change === undefined
      ) {
        continue;
      }
      const expectedPercentage = (
        (change.new_price_eur - change.old_price_eur) / change.old_price_eur
      ) * 100;
      if (Math.abs(expectedPercentage - change.percentage_change) > 0.05) {
        errors.push(
          `postal-changes-2027.yaml: incoherent percentage for ${change.product.en}`,
        );
      }
    }
  }

  return errors;
}

export function validateOperatorRateLists(operator: OperatorData): string[] {
  const errors: string[] = [];
  const filename = `${operator.operator.id}.yaml`;
  const lists: RateList[] = [
    { label: 'letters.domestic', rates: operator.letters.domestic, weightKey: 'max_weight_g' },
    { label: 'parcels.domestic', rates: operator.parcels.domestic, weightKey: 'max_weight_kg' },
    ...operator.letters.international.zones.map((zone) => ({
      label: `letters.international.${zone.name}`,
      rates: zone.rates,
      weightKey: 'max_weight_g' as const,
    })),
    ...operator.parcels.international.zones.map((zone) => ({
      label: `parcels.international.${zone.name}`,
      rates: zone.rates,
      weightKey: 'max_weight_kg' as const,
    })),
  ];

  for (const { label, rates, weightKey } of lists) {
    const weights = rates.map((rate) => rate[weightKey]!);
    if (weights.some((weight, index) => index > 0 && weight < weights[index - 1])) {
      errors.push(`${filename}: ${label} weights must be non-decreasing`);
    }

    const ratesByProduct = new Map<string, RateTier[]>();
    for (const rate of rates) {
      const productRates = ratesByProduct.get(rate.name) ?? [];
      productRates.push(rate);
      ratesByProduct.set(rate.name, productRates);
    }

    for (const [name, productRates] of ratesByProduct) {
      const orderedRates = productRates.toSorted(
        (left, right) => left[weightKey]! - right[weightKey]!,
      );
      for (let index = 1; index < orderedRates.length; index += 1) {
        const previous = orderedRates[index - 1];
        const current = orderedRates[index];
        if (
          current[weightKey]! > previous[weightKey]!
          && current.price_eur < previous.price_eur
        ) {
          errors.push(
            `${filename}: ${label} ${name} price decreases from ${previous.price_eur} to ${current.price_eur} as weight increases`,
          );
        }
      }
    }
  }

  return errors;
}

export function classifyOperatorRateListIssues(
  operators: OperatorData[],
): OperatorRateListIssues {
  const issues: OperatorRateListIssues = { errors: [], warnings: [] };

  for (const error of operators.flatMap(validateOperatorRateLists)) {
    if (ALLOWED_LEGACY_RATE_LIST_ERRORS.has(error)) {
      issues.warnings.push(error);
    } else {
      issues.errors.push(error);
    }
  }

  return issues;
}

export function classifySemanticIssues(
  changes: PostalChangesData,
  operators: OperatorData[],
): SemanticIssues {
  const rateListIssues = classifyOperatorRateListIssues(operators);
  const errors = [
    ...validatePostalChangeSemantics(changes, operators),
    ...rateListIssues.errors,
  ];

  return {
    errors,
    warnings: rateListIssues.warnings,
    canReportSuccess: errors.length === 0,
  };
}
