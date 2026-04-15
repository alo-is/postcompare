// src/components/ResultCard.tsx
import type { ComparisonResult, Country, Lang } from '../lib/types';
import { t, localePath } from '../i18n/utils';

interface ResultCardProps {
  result: ComparisonResult;
  countries: Country[];
  lang: Lang;
  variant?: 'default' | 'muted';
}

export default function ResultCard({ result, countries, lang, variant = 'default' }: ResultCardProps) {
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
    <div className={`result-card ${result.isBestPrice && variant !== 'muted' ? 'result-card--best' : ''} ${variant === 'muted' ? 'result-card--muted' : ''}`}>
      {result.isBestPrice && variant !== 'muted' && (
        <span className="result-card__badge">{t(lang, 'results.best_price')}</span>
      )}

      <div className="result-card__operator">
        <span className="result-card__flag">{originCountry?.flag}</span>
        <div>
          <div className="result-card__name">{result.operator.name}</div>
          <div className="result-card__product">{result.productName}</div>
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
