// tests/validate-schema.test.ts
import { describe, it, expect } from 'vitest';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const DATA_DIR = path.resolve(process.cwd(), 'data');

describe('operator YAML schema validation', () => {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);

  const schemaPath = path.join(DATA_DIR, 'schema', 'operator.schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
  const validate = ajv.compile(schema);

  const operatorsDir = path.join(DATA_DIR, 'operators');
  const files = fs.readdirSync(operatorsDir).filter((f) => f.endsWith('.yaml'));

  for (const file of files) {
    it(`validates ${file}`, () => {
      const content = fs.readFileSync(path.join(operatorsDir, file), 'utf-8');
      const data = yaml.load(content);
      const valid = validate(data);
      if (!valid) {
        const errors = validate.errors?.map(
          (e) => `${e.instancePath} ${e.message}`,
        );
        expect(valid, `Schema errors:\n${errors?.join('\n')}`).toBe(true);
      }
      expect(valid).toBe(true);
    });
  }

  it('accepts official operator sources and unavailable-letter metadata', () => {
    const content = fs.readFileSync(path.join(operatorsDir, 'la-poste-fr.yaml'), 'utf-8');
    const operatorData = yaml.load(content) as {
      operator: Record<string, unknown>;
      letters: Record<string, unknown>;
    };
    operatorData.operator.sources = [{
      title: 'Official tariff notice',
      url: 'https://www.laposte.fr/tarifs',
      retrieved_at: '2026-08-10',
      effective_from: '2027-01-01',
    }];
    operatorData.letters.available = false;
    operatorData.letters.unavailable_since = '2027-01-01';
    operatorData.letters.notice = {
      fr: 'Tarifs indisponibles',
      en: 'Rates unavailable',
      de: 'Tarife nicht verfügbar',
    };

    expect(validate(operatorData)).toBe(true);
  });

  it('rejects incomplete official sources and unavailable letters without their required metadata', () => {
    const content = fs.readFileSync(path.join(operatorsDir, 'la-poste-fr.yaml'), 'utf-8');
    const validOperator = yaml.load(content) as {
      operator: Record<string, unknown>;
      letters: Record<string, unknown>;
    };
    validOperator.operator.sources = [{
      title: 'Official tariff notice',
      url: 'https://www.laposte.fr/tarifs',
      retrieved_at: '2026-08-10',
    }];
    validOperator.letters.available = false;
    validOperator.letters.unavailable_since = '2027-01-01';
    validOperator.letters.notice = {
      fr: 'Tarifs indisponibles',
      en: 'Rates unavailable',
      de: 'Tarife nicht verfügbar',
    };

    const incompleteSource = structuredClone(validOperator);
    delete (incompleteSource.operator.sources as Array<Record<string, unknown>>)[0].title;
    const unavailableWithoutDate = structuredClone(validOperator);
    delete unavailableWithoutDate.letters.unavailable_since;
    const unavailableWithoutNotice = structuredClone(validOperator);
    delete unavailableWithoutNotice.letters.notice;

    expect(validate(incompleteSource)).toBe(false);
    expect(validate(unavailableWithoutDate)).toBe(false);
    expect(validate(unavailableWithoutNotice)).toBe(false);
  });
});

describe('postal-change YAML schema validation', () => {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);

  const schemaPath = path.join(DATA_DIR, 'schema', 'postal-change.schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
  const validate = ajv.compile(schema);

  it('validates the 2027 consumer announcements', () => {
    const content = fs.readFileSync(path.join(DATA_DIR, 'postal-changes-2027.yaml'), 'utf-8');
    const valid = validate(yaml.load(content));
    const errors = validate.errors?.map((error) => `${error.instancePath} ${error.message}`);

    expect(valid, `Schema errors:\n${errors?.join('\n')}`).toBe(true);
  });
});
