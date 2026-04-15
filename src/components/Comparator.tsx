// src/components/Comparator.tsx
import { useState, useCallback } from 'react';
import ComparatorForm from './ComparatorForm';
import ResultsList from './ResultsList';
import { compare } from '../lib/comparison-engine';
import { t } from '../i18n/utils';
import type {
  OperatorData,
  Country,
  SearchParams,
  ComparisonResult,
  Lang,
} from '../lib/types';

interface ComparatorProps {
  operators: OperatorData[];
  countries: Country[];
  lang: Lang;
}

export default function Comparator({ operators, countries, lang }: ComparatorProps) {
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentParams, setCurrentParams] = useState<SearchParams | null>(null);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  const handleSearch = useCallback(
    (params: SearchParams) => {
      const searchResults = compare(operators, params);
      setResults(searchResults);
      setHasSearched(true);
      setCurrentParams(params);
      setMobileFormOpen(false);
    },
    [operators],
  );

  const getCountryName = (code: string): string => {
    const country = countries.find((c) => c.code === code);
    if (!country) return code;
    return country[`name_${lang}` as keyof Country] as string;
  };

  const getCountryFlag = (code: string): string => {
    return countries.find((c) => c.code === code)?.flag ?? '';
  };

  return (
    <>
      {/* Mobile summary bar */}
      {hasSearched && currentParams && !mobileFormOpen && (
        <div className="mobile-summary">
          <div className="mobile-summary__pills">
            <span className="pill">
              {currentParams.type === 'letter' ? '\u2709\uFE0F' : '\uD83D\uDCE6'}{' '}
              {t(lang, `form.${currentParams.type}`)}
            </span>
            <span className="pill">
              {currentParams.weight}
              {currentParams.type === 'letter' ? 'g' : 'kg'}
            </span>
            <span className="pill">
              {currentParams.origin === 'all'
                ? t(lang, 'form.all_countries')
                : `${getCountryFlag(currentParams.origin)} ${getCountryName(currentParams.origin)}`}
              {' \u2192 '}
              {currentParams.destination === 'domestic'
                ? t(lang, 'form.domestic')
                : `${getCountryFlag(currentParams.destination)} ${getCountryName(currentParams.destination)}`}
            </span>
          </div>
          <button
            className="mobile-summary__modify"
            onClick={() => setMobileFormOpen(true)}
          >
            {t(lang, 'form.modify')}
          </button>
        </div>
      )}

      <div className="main-layout">
        {/* Sidebar form */}
        <aside className={`sidebar ${hasSearched && !mobileFormOpen ? 'sidebar--collapsed' : ''}`}>
          <ComparatorForm
            countries={countries}
            lang={lang}
            onSearch={handleSearch}
            initialParams={currentParams ?? undefined}
          />
        </aside>

        {/* Results */}
        <main className="main-content">
          <ResultsList
            results={results}
            countries={countries}
            lang={lang}
            hasSearched={hasSearched}
          />
        </main>
      </div>
    </>
  );
}
