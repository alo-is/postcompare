// src/components/ComparatorForm.tsx
import { useState, useEffect, useRef } from 'react';
import type { SearchParams, ShipmentType, Country, Lang } from '../lib/types';
import { t } from '../i18n/utils';

interface ComparatorFormProps {
  countries: Country[];
  lang: Lang;
  onSearch: (params: SearchParams) => void;
  /** Called when the visitor presses the submit button (closes the form on mobile). */
  onDone?: () => void;
  initialParams?: SearchParams;
}

export default function ComparatorForm({
  countries,
  lang,
  onSearch,
  onDone,
  initialParams,
}: ComparatorFormProps) {
  const [type, setType] = useState<ShipmentType>(initialParams?.type ?? 'letter');
  const [weight, setWeight] = useState<number>(initialParams?.weight ?? 20);
  const [origin, setOrigin] = useState<string>(initialParams?.origin ?? 'all');
  const [destination, setDestination] = useState<string>(
    initialParams?.destination ?? 'domestic',
  );

  const countryName = (c: Country): string => c[`name_${lang}` as keyof Country] as string;

  const isFirstRender = useRef(true);

  const minWeight = type === 'letter' ? 1 : 0.1;
  const weightInvalid = weight <= 0 || isNaN(weight);

  // Auto-search on any form value change (skip if weight is invalid)
  useEffect(() => {
    if (weightInvalid) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      onSearch({ type, weight, origin, destination });
      return;
    }
    const timer = setTimeout(() => {
      onSearch({ type, weight, origin, destination });
    }, 300);
    return () => clearTimeout(timer);
  }, [type, weight, origin, destination]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (weightInvalid) return;
    onSearch({ type, weight, origin, destination });
    onDone?.();
  };

  const selectType = (next: ShipmentType) => {
    if (next === type) return;
    setType(next);
    setWeight(next === 'letter' ? 20 : 1);
  };

  return (
    <form className="card ship-form" onSubmit={handleSubmit} noValidate>
      <h2 className="ship-form__title">{t(lang, 'ui.your_shipment')}</h2>

      <div className="field">
        <span className="field__label" id="type-label">{t(lang, 'form.type')}</span>
        <div className="segmented" role="group" aria-labelledby="type-label">
          {(['letter', 'parcel'] as const).map((value) => (
            <button
              key={value}
              type="button"
              className="segmented__opt"
              aria-pressed={type === value}
              onClick={() => selectType(value)}
            >
              {t(lang, `form.${value}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="weight">
          {type === 'letter' ? t(lang, 'form.weight_grams') : t(lang, 'form.weight_kg')}
        </label>
        <div className="unit-input">
          <input
            id="weight"
            type="number"
            inputMode="decimal"
            className="input"
            value={Number.isNaN(weight) ? '' : weight}
            onChange={(e) => setWeight(e.target.value === '' ? NaN : Number(e.target.value))}
            min={minWeight}
            max={type === 'letter' ? 2000 : 50}
            step={type === 'letter' ? 1 : 0.1}
            aria-invalid={weightInvalid || undefined}
            aria-describedby={weightInvalid ? 'weight-error' : undefined}
          />
          <span className="unit-input__unit" aria-hidden="true">{type === 'letter' ? 'g' : 'kg'}</span>
        </div>
        {weightInvalid && (
          <span className="field__error" id="weight-error">
            {t(lang, 'form.weight_error', { min: String(minWeight) })}
          </span>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="origin">
          {t(lang, 'form.origin')}
        </label>
        <select id="origin" className="select" value={origin} onChange={(e) => setOrigin(e.target.value)}>
          <option value="all">{t(lang, 'form.all_countries')}</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>{countryName(c)}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="destination">
          {t(lang, 'form.destination')}
        </label>
        <select
          id="destination"
          className="select"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        >
          <option value="domestic">{t(lang, 'form.domestic')}</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>{countryName(c)}</option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn--primary ship-form__submit compare-submit">
        {t(lang, 'form.compare')}
      </button>
    </form>
  );
}
