// src/components/ResultCard.tsx
import type { ComparisonResult, Country, Lang } from '../lib/types';
import { t, localePath } from '../i18n/utils';

interface ResultCardProps {
  result: ComparisonResult;
  countries: Country[];
  lang: Lang;
  rank: number;
  variant?: 'default' | 'muted';
  isUserCountry?: boolean;
  isNationalOperator?: boolean;
  totalResults?: number;
}

const numberLocale: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE' };

export function formatEur(value: number, lang: Lang): string {
  return new Intl.NumberFormat(numberLocale[lang], { style: 'currency', currency: 'EUR' }).format(value);
}

export default function ResultCard({ result, countries, lang, rank, variant = 'default', isUserCountry = false, isNationalOperator = false, totalResults = 2 }: ResultCardProps) {
  const getCountry = (code: string): Country | undefined =>
    countries.find((c) => c.code === code);

  const originCountry = getCountry(result.route.origin);
  const destCountry = getCountry(result.route.destination);

  const countryName = (country: Country | undefined): string => {
    if (!country) return '';
    return country[`name_${lang}` as keyof Country] as string;
  };

  const muted = variant === 'muted';
  const isBest = result.isBestPrice && totalResults > 1 && !muted;

  const tags: string[] = [];
  if (isBest) tags.push(t(lang, 'results.best_price'));
  if (isNationalOperator && !muted) tags.push(lang === 'fr' ? 'Opérateur national' : lang === 'de' ? 'Nationaler Betreiber' : 'National operator');
  if (isUserCountry && !muted) tags.push(lang === 'fr' ? 'Votre pays' : lang === 'de' ? 'Ihr Land' : 'Your country');

  const route = result.route.isDomestic
    ? `${t(lang, 'results.domestic_route')} · ${countryName(originCountry)}`
    : `${countryName(originCountry)} → ${countryName(destCountry)}`;

  const meta = [
    result.deliveryDays[0] === result.deliveryDays[1]
      ? `${result.deliveryDays[0]} ${t(lang, result.deliveryDays[0] === 1 ? 'results.day' : 'results.days')}`
      : `${result.deliveryDays[0]}–${result.deliveryDays[1]} ${t(lang, 'results.days')}`,
    result.tracking === undefined
      ? null
      : t(lang, result.tracking ? 'results.tracked' : 'results.untracked'),
  ].filter(Boolean).join(' · ');

  const className = [
    'rate-row',
    isBest ? 'rate-row--best' : '',
    isUserCountry && !muted ? 'rate-row--user' : '',
    muted ? 'rate-row--muted' : '',
  ].filter(Boolean).join(' ');

  return (
    <li className={className}>
      <span className="rate-row__rank" aria-hidden="true">{String(rank).padStart(2, '0')}</span>

      <div className="rate-row__who">
        <p className="rate-row__name">
          <span className="rate-row__flag" aria-hidden="true">{originCountry?.flag}</span>
          {result.operator.name}
        </p>
        <p className="rate-row__product">{result.productName}</p>
        {tags.length > 0 && <p className="rate-row__tags">{tags.join(' · ')}</p>}
      </div>

      <div className="rate-row__what">
        <p className="rate-row__route">{route}</p>
        <p className="rate-row__meta">{meta}</p>
        {result.options && result.options.length > 0 && !muted && (
          <p className="rate-row__options">
            {result.options.map((opt) => `${opt.name} +${formatEur(opt.price_eur, lang)}`).join(' · ')}
          </p>
        )}
      </div>

      <div className="rate-row__price">
        <data value={result.priceEur.toFixed(2)}>{formatEur(result.priceEur, lang)}</data>
        <a className="rate-row__link" href={localePath(lang, `/operator/${result.operator.id}`)}>
          {t(lang, 'results.see_details')}
          <span className="sr-only"> — {result.operator.name}</span>
        </a>
      </div>
    </li>
  );
}
