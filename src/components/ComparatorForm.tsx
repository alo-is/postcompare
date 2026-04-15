// src/components/ComparatorForm.tsx
import { useState, useEffect, useRef } from 'react';
import type { SearchParams, ShipmentType, Country, Lang } from '../lib/types';
import { t } from '../i18n/utils';

interface ComparatorFormProps {
  countries: Country[];
  lang: Lang;
  onSearch: (params: SearchParams) => void;
  initialParams?: SearchParams;
}

export default function ComparatorForm({
  countries,
  lang,
  onSearch,
  initialParams,
}: ComparatorFormProps) {
  const [type, setType] = useState<ShipmentType>(initialParams?.type ?? 'letter');
  const [weight, setWeight] = useState<number>(initialParams?.weight ?? 20);
  const [origin, setOrigin] = useState<string>(initialParams?.origin ?? 'all');
  const [destination, setDestination] = useState<string>(
    initialParams?.destination ?? 'domestic',
  );

  const countryName = (code: string): string => {
    const country = countries.find((c) => c.code === code);
    if (!country) return code;
    return country[`name_${lang}` as keyof Country] as string;
  };

  const isFirstRender = useRef(true);

  // Auto-search on any form value change
  useEffect(() => {
    // Debounce weight changes to avoid too many updates while typing
    if (isFirstRender.current) {
      isFirstRender.current = false;
      onSearch({ type, weight, origin, destination });
      return;
    }
    const timer = setTimeout(() => {
      onSearch({ type, weight, origin, destination });
    }, 150);
    return () => clearTimeout(timer);
  }, [type, weight, origin, destination]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Type toggle */}
      <div className="form-group">
        <label className="form-label">{t(lang, 'form.type')}</label>
        <div className="type-toggle">
          <button
            type="button"
            className={`type-toggle__btn ${type === 'letter' ? 'type-toggle__btn--active' : ''}`}
            onClick={() => {
              setType('letter');
              setWeight(20);
            }}
          >
            {'\u2709\uFE0F'} {t(lang, 'form.letter')}
          </button>
          <button
            type="button"
            className={`type-toggle__btn ${type === 'parcel' ? 'type-toggle__btn--active' : ''}`}
            onClick={() => {
              setType('parcel');
              setWeight(1);
            }}
          >
            {'\uD83D\uDCE6'} {t(lang, 'form.parcel')}
          </button>
        </div>
      </div>

      {/* Weight input */}
      <div className="form-group">
        <label className="form-label" htmlFor="weight">
          {type === 'letter' ? t(lang, 'form.weight_grams') : t(lang, 'form.weight_kg')}
        </label>
        <input
          id="weight"
          type="number"
          className="form-input"
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
          min={type === 'letter' ? 1 : 0.1}
          max={type === 'letter' ? 2000 : 50}
          step={type === 'letter' ? 1 : 0.1}
        />
      </div>

      {/* Origin country */}
      <div className="form-group">
        <label className="form-label" htmlFor="origin">
          {t(lang, 'form.origin')}
        </label>
        <select
          id="origin"
          className="form-select"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        >
          <option value="all">{t(lang, 'form.all_countries')}</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {countryName(c.code)}
            </option>
          ))}
        </select>
      </div>

      {/* Destination country */}
      <div className="form-group">
        <label className="form-label" htmlFor="destination">
          {t(lang, 'form.destination')}
        </label>
        <select
          id="destination"
          className="form-select"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        >
          <option value="domestic">{t(lang, 'form.domestic')}</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {countryName(c.code)}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn-compare">
        {t(lang, 'form.compare')}
      </button>
    </form>
  );
}
