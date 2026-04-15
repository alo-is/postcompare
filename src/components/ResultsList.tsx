// src/components/ResultsList.tsx
import type { ComparisonResult, Country, Lang } from '../lib/types';
import { t } from '../i18n/utils';
import ResultCard from './ResultCard';

interface ResultsListProps {
  results: ComparisonResult[];
  countries: Country[];
  lang: Lang;
  hasSearched: boolean;
  reverseResults?: ComparisonResult[];
  reverseOrigin?: string;
  reverseDestination?: string;
}

export default function ResultsList({
  results,
  countries,
  lang,
  hasSearched,
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

  return (
    <div>
      <div className="results-header">
        <h2>{t(lang, 'results.title')}</h2>
        <span className="results-count">
          {t(lang, 'results.results_count', { count: results.length })}
        </span>
      </div>

      {results.map((result, index) => (
        <ResultCard
          key={`${result.operator.id}-${result.route.origin}-${index}`}
          result={result}
          countries={countries}
          lang={lang}
        />
      ))}

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
