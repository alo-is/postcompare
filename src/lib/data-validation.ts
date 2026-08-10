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

export function validatePostalChangeSemantics(
  changes: PostalChangesData,
  operators: OperatorData[],
): string[] {
  const errors: string[] = [];
  const operatorsById = new Map(operators.map(({ operator }) => [operator.id, operator]));

  for (const announcement of changes.announcements) {
    const operator = operatorsById.get(announcement.operator_id);
    if (operator && operator.country !== announcement.country) {
      errors.push(
        `postal-changes-2027.yaml: ${announcement.operator_id} country ${announcement.country} does not match operator country ${operator.country}`,
      );
    }
    if (announcement.status === 'confirmed' && announcement.effective_date === null) {
      errors.push(
        `postal-changes-2027.yaml: confirmed announcement ${announcement.operator_id} requires an effective date`,
      );
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
