// src/components/ResultsList.tsx
import type { ComparisonResult, Country, Lang, SearchParams } from '../lib/types';
import { t } from '../i18n/utils';
import ResultCard from './ResultCard';
import { formatWeight } from '../i18n/format';

interface ResultsListProps {
  results: ComparisonResult[];
  countries: Country[];
  lang: Lang;
  hasSearched: boolean;
  searchParams?: SearchParams;
  userCountry?: string | null;
  reverseResults?: ComparisonResult[];
  reverseOrigin?: string;
  reverseDestination?: string;
}

export default function ResultsList({
  results,
  countries,
  lang,
  hasSearched,
  searchParams,
  userCountry,
  reverseResults,
  reverseOrigin,
  reverseDestination,
}: ResultsListProps) {
  const getCountryName = (code: string): string => {
    const country = countries.find((c) => c.code === code);
    if (!country) return code;
    return country[`name_${lang}` as keyof Country] as string;
  };

  if (!hasSearched) {
    return null;
  }

  if (results.length === 0) {
    return (
      <div className="card no-results" role="status">
        <p>{t(lang, 'results.no_results')}</p>
      </div>
    );
  }

  // Build descriptive sentence
  const buildDescription = (): string | null => {
    if (!searchParams) return null;
    // French needs article: "une lettre" / "un colis"
    const typeLabelRaw = searchParams.type === 'letter'
      ? t(lang, 'form.letter').toLowerCase()
      : t(lang, 'form.parcel').toLowerCase();
    const typeLabel = lang === 'fr'
      ? (searchParams.type === 'letter' ? `une ${typeLabelRaw}` : `un ${typeLabelRaw}`)
      : lang === 'de'
        ? (searchParams.type === 'letter' ? `einen ${typeLabelRaw}` : `ein ${typeLabelRaw}`)
        : `a ${typeLabelRaw}`;
    const weightLabel = formatWeight(lang, searchParams.weight, searchParams.type === 'letter' ? 'g' : 'kg');

    if (searchParams.origin === 'all' && searchParams.destination === 'domestic') {
      // "domestic across all countries"
      return t(lang, 'results.desc_all_domestic', { type: typeLabel, weight: weightLabel });
    }
    if (searchParams.origin === 'all' && searchParams.destination !== 'domestic') {
      const destName = getCountryName(searchParams.destination);
      return t(lang, 'results.desc_all_to', { type: typeLabel, weight: weightLabel, destination: destName });
    }
    if (searchParams.origin !== 'all' && searchParams.destination === 'domestic') {
      const originName = getCountryName(searchParams.origin);
      return t(lang, 'results.desc_domestic', { type: typeLabel, weight: weightLabel, origin: originName });
    }
    // specific origin → specific destination
    const originName = getCountryName(searchParams.origin);
    const destName = getCountryName(searchParams.destination);
    return t(lang, 'results.desc_route', { type: typeLabel, weight: weightLabel, origin: originName, destination: destName });
  };

  const description = buildDescription();

  return (
    <div className="results">
      <div className="results__head">
        <h2>{t(lang, 'results.title')}</h2>
        <span className="results__count" role="status">
          {t(lang, 'results.results_count', { count: results.length })}
        </span>
      </div>

      {description && <p className="results__desc">{description}</p>}

      <ol className="results__list">
        {results.map((result, index) => {
          const showNationalBadge = searchParams?.origin !== 'all' && result.route.isDomestic;
          return (
            <li key={`${result.operator.id}-${result.route.origin}-${index}`}>
              <ResultCard
                result={result}
                countries={countries}
                lang={lang}
                isUserCountry={userCountry ? result.operator.country === userCountry : false}
                isNationalOperator={showNationalBadge}
                isBest={result.isBestPrice && results.length > 1}
              />
            </li>
          );
        })}
      </ol>

      {reverseResults && reverseResults.length > 0 && reverseOrigin && reverseDestination && (
        <section className="results results--reverse" aria-labelledby="reverse-title">
          <div className="results__head">
            <h2 id="reverse-title">
              {t(lang, 'results.reverse_route')}
              <span className="results__route">
                {getCountryName(reverseOrigin)} {'\u2192'} {getCountryName(reverseDestination)}
              </span>
            </h2>
            <span className="results__count">
              {t(lang, 'results.results_count', { count: reverseResults.length })}
            </span>
          </div>
          <ol className="results__list">
            {reverseResults.map((result, index) => (
              <li key={`reverse-${result.operator.id}-${result.route.origin}-${index}`}>
                <ResultCard result={result} countries={countries} lang={lang} variant="muted" />
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
