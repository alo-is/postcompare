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
  ShipmentType,
  Lang,
} from '../lib/types';

interface InitialParams {
  type?: string;
  weight?: string;
  origin?: string;
  destination?: string;
}

interface ComparatorProps {
  operators: OperatorData[];
  countries: Country[];
  lang: Lang;
  initialParams?: InitialParams;
}

export default function Comparator({ operators, countries, lang, initialParams }: ComparatorProps) {
  // Build initial SearchParams from URL query params if provided
  const urlSearchParams: SearchParams | undefined = initialParams
    ? {
        type: (initialParams.type === 'letter' || initialParams.type === 'parcel'
          ? initialParams.type
          : 'letter') as ShipmentType,
        weight: initialParams.weight ? Number(initialParams.weight) : 20,
        origin: initialParams.origin || 'all',
        destination: initialParams.destination || 'domestic',
      }
    : undefined;

  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [reverseResults, setReverseResults] = useState<ComparisonResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentParams, setCurrentParams] = useState<SearchParams | null>(urlSearchParams ?? null);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  const handleSearch = useCallback(
    (params: SearchParams) => {
      const searchResults = compare(operators, params);
      setResults(searchResults);
      setHasSearched(true);
      setCurrentParams(params);
      setMobileFormOpen(false);

      // Sync URL params without navigation
      const url = new URL(window.location.href);
      url.searchParams.set('type', params.type);
      url.searchParams.set('weight', String(params.weight));
      url.searchParams.set('origin', params.origin);
      url.searchParams.set('destination', params.destination);
      window.history.replaceState({}, '', url.toString());

      // Compute reverse route if applicable
      if (
        params.origin !== 'all' &&
        params.destination !== 'domestic' &&
        params.origin !== params.destination
      ) {
        const reverseParams: SearchParams = {
          ...params,
          origin: params.destination,
          destination: params.origin,
        };
        setReverseResults(compare(operators, reverseParams));
      } else {
        setReverseResults([]);
      }
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
            initialParams={currentParams ?? urlSearchParams ?? undefined}
          />
        </aside>

        {/* Results */}
        <main className="main-content">
          <ResultsList
            results={results}
            countries={countries}
            lang={lang}
            hasSearched={hasSearched}
            searchParams={currentParams ?? undefined}
            reverseResults={reverseResults.length > 0 ? reverseResults : undefined}
            reverseOrigin={currentParams?.destination !== 'domestic' ? currentParams?.destination : undefined}
            reverseDestination={currentParams?.origin !== 'all' ? currentParams?.origin : undefined}
          />
        </main>
      </div>
    </>
  );
}
