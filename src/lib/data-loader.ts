// src/lib/data-loader.ts
import yaml from 'js-yaml';
import fs from 'node:fs';
import path from 'node:path';
import type { OperatorData, Country } from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');

/**
 * Load all operator YAML files from data/operators/
 */
export function loadAllOperators(): OperatorData[] {
  const operatorsDir = path.join(DATA_DIR, 'operators');
  const files = fs.readdirSync(operatorsDir).filter((f) => f.endsWith('.yaml'));

  return files.map((file) => {
    const content = fs.readFileSync(path.join(operatorsDir, file), 'utf-8');
    return yaml.load(content) as OperatorData;
  });
}

/**
 * Load a single operator by ID
 */
export function loadOperator(id: string): OperatorData | null {
  const filePath = path.join(DATA_DIR, 'operators', `${id}.yaml`);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  return yaml.load(content) as OperatorData;
}

/**
 * Load the countries list
 */
export function loadCountries(): Country[] {
  const content = fs.readFileSync(
    path.join(DATA_DIR, 'countries.yaml'),
    'utf-8',
  );
  const data = yaml.load(content) as { countries: Country[] };
  return data.countries;
}

/**
 * Load Price Level Index data (PLI, EU27=100)
 */
export function loadPriceLevelIndices(): { indices: Record<string, number>; year: number; source: string; source_url: string } {
  const content = fs.readFileSync(
    path.join(DATA_DIR, 'price-level-index.yaml'),
    'utf-8',
  );
  return yaml.load(content) as { indices: Record<string, number>; year: number; source: string; source_url: string };
}

/**
 * Get all operator IDs from the operators directory
 */
export function getOperatorIds(): string[] {
  const operatorsDir = path.join(DATA_DIR, 'operators');
  return fs
    .readdirSync(operatorsDir)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => f.replace('.yaml', ''));
}
