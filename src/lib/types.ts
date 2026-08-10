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
  name_translations?: LocalizedText;
  source?: Source;
  availability?: Availability;
}

/** A single rate tier for parcels */
export interface ParcelRate {
  name: string;
  max_weight_kg: number;
  price_eur: number;
  delivery_days: DeliveryDays;
  tracking: boolean;
  options?: ServiceOption[];
  name_translations?: LocalizedText;
  source?: Source;
  availability?: Availability;
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

/** Text shown in every supported site language. */
export interface LocalizedText {
  fr: string;
  en: string;
  de: string;
}

/** Official source for published or announced postal information. */
export interface Source {
  url: string;
}

/** Whether consumer price information can currently be shown. */
export type Availability = 'published' | 'not_published' | 'upcoming';

export type PostalChangeType =
  | 'price_change'
  | 'product_introduced'
  | 'product_changed'
  | 'product_removed'
  | 'announcement';

export type PostalScope = 'consumer' | 'business';

export interface PostalChange {
  type: PostalChangeType;
  product: LocalizedText;
  availability: Availability;
  old_price_eur?: number;
  new_price_eur?: number;
  percentage_change?: number;
  details?: LocalizedText;
}

export interface PostalAnnouncement {
  country: string;
  operator_id: string;
  scope: PostalScope;
  status: 'confirmed' | 'preview';
  effective_date: string | null;
  source: Source;
  changes: PostalChange[];
}

export interface PostalChangesData {
  announcements: PostalAnnouncement[];
}
