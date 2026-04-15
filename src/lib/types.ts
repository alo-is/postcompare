// src/lib/types.ts

/** Delivery time range in business days [min, max] */
export type DeliveryDays = [number, number];

/** An optional add-on service (insurance, tracking, signature, etc.) */
export interface ServiceOption {
  name: string;
  price_eur: number;
}

/** A single rate tier for letters */
export interface LetterRate {
  name: string;
  max_weight_g: number;
  price_eur: number;
  delivery_days: DeliveryDays;
  options?: ServiceOption[];
}

/** A single rate tier for parcels */
export interface ParcelRate {
  name: string;
  max_weight_kg: number;
  price_eur: number;
  delivery_days: DeliveryDays;
  tracking: boolean;
  options?: ServiceOption[];
}

/** International zone grouping countries with shared rates */
export interface LetterZone {
  name: string;
  countries: string[];
  rates: LetterRate[];
}

export interface ParcelZone {
  name: string;
  countries: string[];
  rates: ParcelRate[];
}

/** Letter rates for an operator */
export interface LetterRates {
  domestic: LetterRate[];
  international: {
    zones: LetterZone[];
  };
}

/** Parcel rates for an operator */
export interface ParcelRates {
  domestic: ParcelRate[];
  international: {
    zones: ParcelZone[];
  };
}

/** Operator metadata */
export interface OperatorInfo {
  id: string;
  name: string;
  country: string;
  currency: string;
  website: string;
  logo: string;
  last_updated: string;
}

/** Complete operator data as stored in YAML */
export interface OperatorData {
  operator: OperatorInfo;
  letters: LetterRates;
  parcels: ParcelRates;
}

/** Country metadata */
export interface Country {
  code: string;
  name_fr: string;
  name_en: string;
  name_de: string;
  flag: string;
  eurozone: boolean;
}

/** Exchange rate entry */
export interface ExchangeRate {
  currency: string;
  rate_to_eur: number;
  date: string;
}

/** Shipment type */
export type ShipmentType = 'letter' | 'parcel';

/** Search parameters from the form */
export interface SearchParams {
  type: ShipmentType;
  weight: number; // grams for letters, kg for parcels
  origin: string | 'all'; // ISO country code or 'all'
  destination: string | 'domestic'; // ISO country code or 'domestic'
}

/** A single comparison result */
export interface ComparisonResult {
  operator: OperatorInfo;
  productName: string;
  priceEur: number;
  deliveryDays: DeliveryDays;
  tracking: boolean;
  isBestPrice: boolean;
  options?: ServiceOption[];
  route: {
    origin: string;
    destination: string;
    isDomestic: boolean;
  };
}

/** Supported languages */
export type Lang = 'fr' | 'en' | 'de';
