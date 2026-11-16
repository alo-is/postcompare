// src/components/ResultCard.tsx
import type { ComparisonResult, Country, Lang } from '../lib/types';
import { t, localePath } from '../i18n/utils';
import { formatDays, formatPrice, formatSurcharge } from '../i18n/format';

interface ResultCardProps {
  result: ComparisonResult;
  countries: Country[];
  lang: Lang;
  /** 'muted' is the compact card used for the reverse route */
  variant?: 'default' | 'muted';
  isUserCountry?: boolean;
  isNationalOperator?: boolean;
  /** Cheapest of the list (only meaningful with more than one result) */
  isBest?: boolean;
}

export default function ResultCard({
  result,
  countries,
  lang,
  variant = 'default',
  isUserCountry = false,
  isNationalOperator = false,
  isBest = false,
}: ResultCardProps) {
  const compact = variant === 'muted';
  const getCountry = (code: string): Country | undefined => countries.find((c) => c.code === code);
  const countryName = (country: Country | undefined): string =>
    country ? (country[`name_${lang}` as keyof Country] as string) : '';

  const originCountry = getCountry(result.route.origin);
  const destCountry = getCountry(result.route.destination);

  const routeLabel = result.route.isDomestic
    ? `${t(lang, 'results.domestic_route')} (${countryName(originCountry)})`
    : `${countryName(originCountry)} → ${countryName(destCountry)}`;

  const best = isBest && !compact;
  const classes = ['card', 'result', best && 'result--best', compact && 'result--compact']
    .filter(Boolean)
    .join(' ');

  return (
    <article className={classes}>
      <div className="result__who">
        <span className="cc" title={countryName(originCountry)}>{result.route.origin}</span>
        <div className="result__id">
          <h3 className="result__name">{result.operator.name}</h3>
          <p className="result__product">{result.productName}</p>
          {!compact && (isUserCountry || isNationalOperator) && (
            <p className="result__tags">
              {isNationalOperator && <span className="badge badge--outline">{t(lang, 'ui.national_operator')}</span>}
              {isUserCountry && <span className="badge badge--outline">{t(lang, 'ui.your_country')}</span>}
            </p>
          )}
        </div>
      </div>

      <div className="result__facts">
        <p className="result__route">{routeLabel}</p>
        <dl>
          <div className="result__fact">
            <dt>{t(lang, 'results.delivery')}</dt>
            <dd><span className="num">{formatDays(result.deliveryDays)}</span> {t(lang, 'results.days')}</dd>
          </div>
          {result.tracking !== undefined && (
            <div className="result__fact">
              <dt>{t(lang, 'results.tracking')}</dt>
              <dd>{result.tracking ? t(lang, 'results.tracking_yes') : t(lang, 'results.tracking_no')}</dd>
            </div>
          )}
        </dl>
      </div>

      {!compact && result.options && result.options.length > 0 && (
        <ul className="result__options chips" aria-label={t(lang, 'operator.options')}>
          {result.options.map((opt, i) => (
            <li key={i} className="chip">
              {opt.name} <span className="num">{formatSurcharge(lang, opt.price_eur)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="result__price">
        {best && <span className="badge badge--accent">{t(lang, 'results.best_price')}</span>}
        <span className="result__amount num">{formatPrice(lang, result.priceEur)}</span>
        <a className="link result__link" href={localePath(lang, `/operator/${result.operator.id}`)}>
          {t(lang, 'results.see_details')}
          <span className="sr-only"> {result.operator.name}</span>
        </a>
      </div>
    </article>
  );
}
