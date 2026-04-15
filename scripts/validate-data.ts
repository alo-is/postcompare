// scripts/validate-data.ts
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const DATA_DIR = path.resolve(process.cwd(), 'data');

function main() {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);

  // Load schema
  const schemaPath = path.join(DATA_DIR, 'schema', 'operator.schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
  const validate = ajv.compile(schema);

  // Find all operator YAML files
  const operatorsDir = path.join(DATA_DIR, 'operators');
  const files = fs.readdirSync(operatorsDir).filter((f) => f.endsWith('.yaml'));

  let hasErrors = false;

  for (const file of files) {
    const filePath = path.join(operatorsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = yaml.load(content);

    const valid = validate(data);
    if (!valid) {
      hasErrors = true;
      console.error(`\n❌ ${file}:`);
      for (const err of validate.errors ?? []) {
        console.error(`   ${err.instancePath} ${err.message}`);
      }
    } else {
      console.log(`✅ ${file}`);
    }
  }

  if (hasErrors) {
    console.error('\nValidation failed.');
    process.exit(1);
  } else {
    console.log(`\nAll ${files.length} operator files valid.`);
  }
}

main();
