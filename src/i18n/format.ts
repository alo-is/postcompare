// src/i18n/format.ts — one price and weight format for the whole UI
import type { Lang } from '../lib/types';

const locales: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE' };

const priceFormatters = new Map<Lang, Intl.NumberFormat>();
const numberFormatters = new Map<Lang, Intl.NumberFormat>();

/** 0.4 -> "0,40 €" (fr, de) or "€0.40" (en) */
export function formatPrice(lang: Lang, value: number): string {
  let f = priceFormatters.get(lang);
  if (!f) {
    f = new Intl.NumberFormat(locales[lang], { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
    priceFormatters.set(lang, f);
  }
  return f.format(value);
}

/** "+0,40 €" for an option surcharge */
export function formatSurcharge(lang: Lang, value: number): string {
  return `+${formatPrice(lang, value)}`;
}

/** 20, 'g' -> "20 g"; 0.5, 'kg' -> "0,5 kg" (non-breaking space) */
export function formatWeight(lang: Lang, value: number, unit: 'g' | 'kg'): string {
  let f = numberFormatters.get(lang);
  if (!f) {
    f = new Intl.NumberFormat(locales[lang], { maximumFractionDigits: 2 });
    numberFormatters.set(lang, f);
  }
  return `${f.format(value)} ${unit}`;
}

/** [1, 2] -> "1–2" */
export function formatDays(days: [number, number] | number[]): string {
  return days[0] === days[1] ? String(days[0]) : `${days[0]}–${days[1]}`;
}
