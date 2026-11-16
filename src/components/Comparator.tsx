// src/components/Comparator.tsx
import { useState, useCallback, useMemo, useEffect } from 'react';
import ComparatorForm from './ComparatorForm';
import ResultsList from './ResultsList';
import { compare } from '../lib/comparison-engine';
import { t } from '../i18n/utils';
import { formatWeight } from '../i18n/format';
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

function detectUserCountry(supportedCodes: string[]): string | null {
  if (typeof window === 'undefined') return null;
  const lang = navigator.language || '';
  const parts = lang.split('-');
  let code = '';
  if (parts.length >= 2) {
    code = parts[1].toUpperCase();
  } else {
    const map: Record<string, string> = { fr:'FR',de:'DE',es:'ES',it:'IT',nl:'NL',pt:'PT',pl:'PL',ro:'RO',hu:'HU',el:'GR',bg:'BG',hr:'HR',sk:'SK',sl:'SI',lt:'LT',lv:'LV',et:'EE',fi:'FI',sv:'SE',da:'DK',no:'NO',is:'IS',en:'GB' };
    code = map[parts[0].toLowerCase()] || '';
  }
  return code && supportedCodes.includes(code) ? code : null;
}

function getParamsFromURL(): SearchParams | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  const weight = params.get('weight');
  const origin = params.get('origin');
  const destination = params.get('destination');
  if (!type && !weight && !origin && !destination) return undefined;
  return {
    type: (type === 'letter' || type === 'parcel' ? type : 'letter') as ShipmentType,
    weight: weight ? Number(weight) : 20,
    origin: origin || 'all',
    destination: destination || 'domestic',
  };
}

export default function Comparator({ operators, countries, lang, initialParams }: ComparatorProps) {
  // The page is static: the server render (and the first client render) cannot see the
  // query string. Read it only after mount, then remount the form with it, so hydration
  // matches the server HTML (React #418 otherwise).
  const [mounted, setMounted] = useState(false);
  const [paramsAtLoad] = useState(getParamsFromURL); // captured before any search rewrites the URL
  useEffect(() => setMounted(true), []);

  const urlSearchParams: SearchParams | undefined = (mounted ? paramsAtLoad : undefined)
    ?? (initialParams
      ? {
          type: (initialParams.type === 'letter' || initialParams.type === 'parcel'
            ? initialParams.type
            : 'letter') as ShipmentType,
          weight: initialParams.weight ? Number(initialParams.weight) : 20,
          origin: initialParams.origin || 'all',
          destination: initialParams.destination || 'domestic',
        }
      : undefined);

  const userCountry = useMemo(
    () => detectUserCountry(countries.map(c => c.code)),
    [countries],
  );

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

  const routeLabel = (params: SearchParams): string => {
    const from = params.origin === 'all' ? t(lang, 'form.all_countries') : getCountryName(params.origin);
    const to = params.destination === 'domestic' ? t(lang, 'form.domestic') : getCountryName(params.destination);
    return `${from} \u2192 ${to}`;
  };

  const formCollapsed = hasSearched && !mobileFormOpen;

  return (
    <div className="compare-layout">
      {/* Mobile summary bar: the current search, with a button to edit it */}
      {formCollapsed && currentParams && (
        <div className="mobile-summary">
          <p className="mobile-summary__text">
            <span>{t(lang, `form.${currentParams.type}`)}</span>
            <span className="num">
              {formatWeight(lang, currentParams.weight, currentParams.type === 'letter' ? 'g' : 'kg')}
            </span>
            <span>{routeLabel(currentParams)}</span>
          </p>
          <button
            type="button"
            className="btn btn--secondary mobile-summary__edit"
            aria-controls="compare-form"
            aria-expanded="false"
            onClick={() => setMobileFormOpen(true)}
          >
            {t(lang, 'form.modify')}
          </button>
        </div>
      )}

      <aside
        id="compare-form"
        className={`compare-layout__form ${formCollapsed ? 'is-collapsed' : ''}`}
        aria-label={t(lang, 'ui.your_shipment')}
      >
        <ComparatorForm
          key={mounted ? 'client' : 'server'}
          countries={countries}
          lang={lang}
          onSearch={handleSearch}
          onDone={() => setMobileFormOpen(false)}
          initialParams={urlSearchParams}
        />
      </aside>

      <div className="compare-layout__results">
        <ResultsList
          results={results}
          countries={countries}
          lang={lang}
          hasSearched={hasSearched}
          searchParams={currentParams ?? undefined}
          userCountry={userCountry}
          reverseResults={reverseResults.length > 0 ? reverseResults : undefined}
          reverseOrigin={currentParams?.destination !== 'domestic' ? currentParams?.destination : undefined}
          reverseDestination={currentParams?.origin !== 'all' ? currentParams?.origin : undefined}
        />
      </div>
    </div>
  );
}
