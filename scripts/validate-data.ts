// scripts/validate-data.ts
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { OperatorData, PostalChangesData } from '../src/lib/types';
import {
  validateOperatorRateLists,
  validatePostalChangeSemantics,
} from '../src/lib/data-validation';

const DATA_DIR = path.resolve(process.cwd(), 'data');

function main() {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);

  const loadValidator = (filename: string) => {
    const schemaPath = path.join(DATA_DIR, 'schema', filename);
    return ajv.compile(JSON.parse(fs.readFileSync(schemaPath, 'utf-8')));
  };
  const validateOperator = loadValidator('operator.schema.json');
  const validatePostalChanges = loadValidator('postal-change.schema.json');

  // Find all operator YAML files
  const operatorsDir = path.join(DATA_DIR, 'operators');
  const files = fs.readdirSync(operatorsDir).filter((f) => f.endsWith('.yaml'));
  const operators: OperatorData[] = [];

  let hasErrors = false;

  for (const file of files) {
    const filePath = path.join(operatorsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = yaml.load(content);
    operators.push(data as OperatorData);

    const valid = validateOperator(data);
    if (!valid) {
      hasErrors = true;
      console.error(`\n❌ ${file}:`);
      for (const err of validateOperator.errors ?? []) {
        console.error(`   ${err.instancePath} ${err.message}`);
      }
    } else {
      console.log(`✅ ${file}`);
    }
  }

  const postalChangesPath = path.join(DATA_DIR, 'postal-changes-2027.yaml');
  const postalChanges = yaml.load(fs.readFileSync(postalChangesPath, 'utf-8')) as PostalChangesData;
  const postalChangesValid = validatePostalChanges(postalChanges);
  if (!postalChangesValid) {
    hasErrors = true;
    console.error('\n❌ postal-changes-2027.yaml:');
    for (const err of validatePostalChanges.errors ?? []) {
      console.error(`   ${err.instancePath} ${err.message}`);
    }
  } else {
    console.log('✅ postal-changes-2027.yaml');
  }

  const operatorIds = new Set(operators.map(({ operator }) => operator.id));
  for (const announcement of postalChanges.announcements) {
    if (!operatorIds.has(announcement.operator_id)) {
      hasErrors = true;
      console.error(`❌ postal-changes-2027.yaml: unknown operator ${announcement.operator_id}`);
    }
    for (const change of announcement.changes) {
      if (change.type !== 'price_change') continue;
      const expectedPercentage = ((change.new_price_eur! - change.old_price_eur!) / change.old_price_eur!) * 100;
      if (Math.abs(expectedPercentage - change.percentage_change!) > 0.05) {
        hasErrors = true;
        console.error(`❌ postal-changes-2027.yaml: incoherent percentage for ${change.product.en}`);
      }
    }
  }

  const sourceDocumentedOperators = operators.filter(
    ({ operator }) => (operator.sources?.length ?? 0) > 0,
  );
  const legacyOperators = operators.filter(
    ({ operator }) => (operator.sources?.length ?? 0) === 0,
  );
  const semanticErrors = [
    ...validatePostalChangeSemantics(postalChanges, operators),
    ...sourceDocumentedOperators.flatMap(validateOperatorRateLists),
  ];
  for (const error of semanticErrors) {
    hasErrors = true;
    console.error(`❌ ${error}`);
  }
  console.log(
    `✅ semantic rate-list invariants (${sourceDocumentedOperators.length} source-documented operators)`,
  );

  const legacyRateWarnings = legacyOperators.flatMap(validateOperatorRateLists);
  for (const warning of legacyRateWarnings) {
    console.warn(`⚠️ legacy rate-list warning (non-blocking, no update source): ${warning}`);
  }

  if (hasErrors) {
    console.error('\nValidation failed.');
    process.exit(1);
  } else {
    console.log(`\nAll ${files.length} operator files and postal changes valid.`);
  }
}

main();
