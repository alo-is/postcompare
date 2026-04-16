// src/components/ResultsList.tsx
import type { ComparisonResult, Country, Lang, SearchParams } from '../lib/types';
import { t } from '../i18n/utils';
import ResultCard from './ResultCard';

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

  const getCountryFlag = (code: string): string => {
    return countries.find((c) => c.code === code)?.flag ?? '';
  };
  if (!hasSearched) {
    return null;
  }

  if (results.length === 0) {
    return (
      <div className="no-results">
        <div className="no-results__icon">{'\uD83D\uDCED'}</div>
        <p>{t(lang, 'results.no_results')}</p>
      </div>
    );
  }

  // Build descriptive sentence
  const buildDescription = (): string | null => {
    if (!searchParams) return null;
    const typeLabel = searchParams.type === 'letter'
      ? t(lang, 'form.letter').toLowerCase()
      : t(lang, 'form.parcel').toLowerCase();
    const weightLabel = searchParams.type === 'letter'
      ? `${searchParams.weight}g`
      : `${searchParams.weight}kg`;

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
    <div>
      <div className="results-header">
        <h2>{t(lang, 'results.title')}</h2>
        <span className="results-count">
          {t(lang, 'results.results_count', { count: results.length })}
        </span>
      </div>

      {description && (
        <p className="results-description">{description}</p>
      )}

      {results.map((result, index) => {
        const showNationalBadge = searchParams?.origin !== 'all' && result.route.isDomestic;
        return (
          <ResultCard
            key={`${result.operator.id}-${result.route.origin}-${index}`}
            result={result}
            countries={countries}
            lang={lang}
            isUserCountry={userCountry ? result.operator.country === userCountry : false}
            isNationalOperator={showNationalBadge}
          />
        );
      })}

      {reverseResults && reverseResults.length > 0 && reverseOrigin && reverseDestination && (
        <div className="reverse-results">
          <div className="results-header">
            <h2>
              {t(lang, 'results.reverse_route')} : {getCountryFlag(reverseOrigin)} {getCountryName(reverseOrigin)} {'\u2192'} {getCountryFlag(reverseDestination)} {getCountryName(reverseDestination)}
            </h2>
            <span className="results-count">
              {t(lang, 'results.results_count', { count: reverseResults.length })}
            </span>
          </div>
          {reverseResults.map((result, index) => (
            <ResultCard
              key={`reverse-${result.operator.id}-${result.route.origin}-${index}`}
              result={result}
              countries={countries}
              lang={lang}
              variant="muted"
            />
          ))}
        </div>
      )}
    </div>
  );
}
