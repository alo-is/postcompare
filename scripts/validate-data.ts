// scripts/validate-data.ts
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { OperatorData, PostalChangesData } from '../src/lib/types';
import { classifySemanticIssues } from '../src/lib/data-validation';

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

  const semanticIssues = classifySemanticIssues(postalChanges, operators);
  for (const error of semanticIssues.errors) {
    hasErrors = true;
    console.error(`❌ ${error}`);
  }
  for (const warning of semanticIssues.warnings) {
    console.warn(`⚠️ allowlisted legacy rate-list warning (non-blocking): ${warning}`);
  }
  if (semanticIssues.canReportSuccess) {
    console.log(
      `✅ semantic rate-list invariants (${operators.length} operators checked, ${semanticIssues.warnings.length} explicit legacy exceptions)`,
    );
  }

  if (hasErrors) {
    console.error('\nValidation failed.');
    process.exit(1);
  } else {
    console.log(`\nAll ${files.length} operator files and postal changes valid.`);
  }
}

main();
