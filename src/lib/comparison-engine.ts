// src/lib/comparison-engine.ts
import type {
  OperatorData,
  SearchParams,
  ComparisonResult,
  LetterRate,
  ParcelRate,
  DeliveryDays,
} from './types';

/**
 * Find the applicable letter rate for a given weight.
 * Returns the first tier where max_weight_g >= weight.
 * Rates are assumed to be sorted by max_weight ascending in YAML.
 */
function findLetterRate(
  rates: LetterRate[],
  weightG: number,
): LetterRate | null {
  const applicable = rates.find((r) => r.max_weight_g >= weightG);
  return applicable ?? null;
}

/**
 * Find the applicable parcel rate for a given weight.
 * Returns the first tier where max_weight_kg >= weight.
 */
function findParcelRate(
  rates: ParcelRate[],
  weightKg: number,
): ParcelRate | null {
  const applicable = rates.find((r) => r.max_weight_kg >= weightKg);
  return applicable ?? null;
}

/**
 * Look up the rate for a specific operator given search params.
 * Returns null if the operator cannot serve this route/weight.
 */
function findRate(
  operator: OperatorData,
  params: SearchParams,
  originCountry: string,
): {
  productName: string;
  priceEur: number;
  deliveryDays: DeliveryDays;
  tracking: boolean;
  isDomestic: boolean;
} | null {
  const destCountry = params.destination;
  const isDomestic =
    destCountry === 'domestic' || destCountry === originCountry;

  if (params.type === 'letter') {
    if (isDomestic) {
      const rate = findLetterRate(operator.letters.domestic, params.weight);
      if (!rate) return null;
      return {
        productName: rate.name,
        priceEur: rate.price_eur,
        deliveryDays: rate.delivery_days,
        tracking: false,
        isDomestic: true,
      };
    } else {
      // Find the zone containing the destination
      const zone = operator.letters.international.zones.find((z) =>
        z.countries.includes(destCountry),
      );
      if (!zone) return null;
      const rate = findLetterRate(zone.rates, params.weight);
      if (!rate) return null;
      return {
        productName: rate.name,
        priceEur: rate.price_eur,
        deliveryDays: rate.delivery_days,
        tracking: false,
        isDomestic: false,
      };
    }
  } else {
    // parcel
    if (isDomestic) {
      const rate = findParcelRate(operator.parcels.domestic, params.weight);
      if (!rate) return null;
      return {
        productName: rate.name,
        priceEur: rate.price_eur,
        deliveryDays: rate.delivery_days,
        tracking: rate.tracking,
        isDomestic: true,
      };
    } else {
      const zone = operator.parcels.international.zones.find((z) =>
        z.countries.includes(destCountry),
      );
      if (!zone) return null;
      const rate = findParcelRate(zone.rates, params.weight);
      if (!rate) return null;
      return {
        productName: rate.name,
        priceEur: rate.price_eur,
        deliveryDays: rate.delivery_days,
        tracking: rate.tracking,
        isDomestic: false,
      };
    }
  }
}

/**
 * Main comparison function. Takes all operators and search params,
 * returns results sorted by price ascending with isBestPrice marked.
 */
export function compare(
  operators: OperatorData[],
  params: SearchParams,
): ComparisonResult[] {
  const results: ComparisonResult[] = [];

  for (const op of operators) {
    const originCountry = op.operator.country;

    // If user selected a specific origin, skip operators from other countries
    if (params.origin !== 'all' && originCountry !== params.origin) {
      continue;
    }

    // Determine the effective destination for this operator
    const effectiveDestination =
      params.destination === 'domestic' ? originCountry : params.destination;

    const rate = findRate(op, params, originCountry);
    if (!rate) continue;

    results.push({
      operator: op.operator,
      productName: rate.productName,
      priceEur: rate.priceEur,
      deliveryDays: rate.deliveryDays,
      tracking: rate.tracking,
      isBestPrice: false, // set below
      route: {
        origin: originCountry,
        destination: effectiveDestination,
        isDomestic: rate.isDomestic,
      },
    });
  }

  // Sort by price ascending
  results.sort((a, b) => a.priceEur - b.priceEur);

  // Mark best price
  if (results.length > 0) {
    results[0].isBestPrice = true;
  }

  return results;
}
