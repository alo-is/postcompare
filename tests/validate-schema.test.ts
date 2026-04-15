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
});
