// src/i18n/utils.ts
import type { Lang } from '../lib/types';
import fr from './fr.json';
import en from './en.json';
import de from './de.json';

const translations: Record<Lang, Record<string, unknown>> = { fr, en, de };

/**
 * Get a translated string by dot-notation key.
 * Example: t('fr', 'form.compare') => "Comparer"
 * Supports {placeholder} replacement via the params argument.
 */
export function t(
  lang: Lang,
  key: string,
  params?: Record<string, string | number>,
): string {
  const keys = key.split('.');
  let value: unknown = translations[lang];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      console.warn(`Missing translation: ${lang}.${key}`);
      return key;
    }
  }

  if (typeof value !== 'string') return key;

  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, name) =>
      params[name] !== undefined ? String(params[name]) : `{${name}}`,
    );
  }

  return value;
}

/**
 * Get the language from a URL path (e.g., /fr/about => 'fr')
 */
export function getLangFromPath(path: string): Lang {
  const match = path.match(/^\/(fr|en|de)/);
  return (match?.[1] as Lang) ?? 'fr';
}

/**
 * Build a localized path
 */
export function localePath(lang: Lang, path: string): string {
  return `/${lang}${path}`;
}

/** All supported languages */
export const languages: Lang[] = ['fr', 'en', 'de'];

/** Language display names */
export const languageNames: Record<Lang, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
};
