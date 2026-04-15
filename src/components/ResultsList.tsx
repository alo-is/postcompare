// src/components/ResultsList.tsx
import type { ComparisonResult, Country, Lang } from '../lib/types';
import { t } from '../i18n/utils';
import ResultCard from './ResultCard';

interface ResultsListProps {
  results: ComparisonResult[];
  countries: Country[];
  lang: Lang;
  hasSearched: boolean;
}

export default function ResultsList({
  results,
  countries,
  lang,
  hasSearched,
}: ResultsListProps) {
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
    </div>
  );
}
