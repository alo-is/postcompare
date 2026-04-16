// src/components/ResultCard.tsx
import type { ComparisonResult, Country, Lang } from '../lib/types';
import { t, localePath } from '../i18n/utils';

interface ResultCardProps {
  result: ComparisonResult;
  countries: Country[];
  lang: Lang;
  variant?: 'default' | 'muted';
  isUserCountry?: boolean;
  isNationalOperator?: boolean;
  totalResults?: number;
}

export default function ResultCard({ result, countries, lang, variant = 'default', isUserCountry = false, isNationalOperator = false, totalResults = 2 }: ResultCardProps) {
  const getCountry = (code: string): Country | undefined =>
    countries.find((c) => c.code === code);

  const originCountry = getCountry(result.route.origin);
  const destCountry = getCountry(result.route.destination);

  const countryName = (country: Country | undefined): string => {
    if (!country) return '';
    return country[`name_${lang}` as keyof Country] as string;
  };

  const routeLabel = result.route.isDomestic
    ? `${t(lang, 'results.domestic_route')} (${originCountry?.flag ?? ''} ${countryName(originCountry)})`
    : `${originCountry?.flag ?? ''} ${countryName(originCountry)} \u2192 ${destCountry?.flag ?? ''} ${countryName(destCountry)}`;

  return (
    <div className={`result-card ${result.isBestPrice && totalResults > 1 && variant !== 'muted' ? 'result-card--best' : ''} ${variant === 'muted' ? 'result-card--muted' : ''} ${isUserCountry && variant !== 'muted' ? 'result-card--user' : ''}`}>
      {variant !== 'muted' && (result.isBestPrice && totalResults > 1 || isNationalOperator) && (
        <span className={`result-card__badge ${isNationalOperator && !(result.isBestPrice && totalResults > 1) ? 'result-card__badge--national' : ''}`}>
          {result.isBestPrice && totalResults > 1
            ? isNationalOperator
              ? `${t(lang, 'results.best_price')} · ${lang === 'fr' ? 'Opérateur national' : lang === 'de' ? 'Nationaler Betreiber' : 'National operator'}`
              : t(lang, 'results.best_price')
            : lang === 'fr' ? 'Opérateur national' : lang === 'de' ? 'Nationaler Betreiber' : 'National operator'}
        </span>
      )}

      <div className="result-card__operator">
        <span className="result-card__flag">{originCountry?.flag}</span>
        <div>
          <div className="result-card__name">
            {result.operator.name}
            {isUserCountry && variant !== 'muted' && (
              <span className="result-card__user-badge">
                {lang === 'fr' ? 'Votre pays' : lang === 'de' ? 'Ihr Land' : 'Your country'}
              </span>
            )}
          </div>
          <div className="result-card__product">{result.productName}</div>
          <div className="result-card__country">{countryName(originCountry)}</div>
        </div>
      </div>

      <div className="result-card__details">
        <div>
          <div className="result-card__route">{routeLabel}</div>
          <div className="result-card__delivery">
            {t(lang, 'results.delivery')}: {result.deliveryDays[0]}–{result.deliveryDays[1]}{' '}
            {t(lang, 'results.days')}
          </div>
          {result.tracking !== undefined && (
            <div className="result-card__tracking">
              {t(lang, 'results.tracking')}:{' '}
              {result.tracking ? t(lang, 'results.tracking_yes') : t(lang, 'results.tracking_no')}
            </div>
          )}
          {result.options && result.options.length > 0 && variant !== 'muted' && (
            <div className="result-card__options">
              {result.options.map((opt, i) => (
                <span key={i} className="result-card__option">
                  {opt.name} +{opt.price_eur.toFixed(2)}&euro;
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="result-card__price">
        <div>
          {result.priceEur.toFixed(2)} <span className="result-card__price-unit">EUR</span>
        </div>
        <a
          className="result-card__link"
          href={localePath(lang, `/operator/${result.operator.id}`)}
        >
          {t(lang, 'results.see_details')} {'\u2192'}
        </a>
      </div>
    </div>
  );
}
