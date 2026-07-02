import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });
  return env;
}

const envFile = path.resolve(__dirname, '../.env');
const env = parseEnv(envFile);

const wranglerFile = path.resolve(__dirname, '../wrangler.jsonc');
let wranglerConfig = {};

try {
    const content = fs.readFileSync(wranglerFile, 'utf-8');
    // Basic JSON5/JSONC parser (strip comments)
    const jsonWithoutComments = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
    wranglerConfig = JSON.parse(jsonWithoutComments);
} catch (e) {
    console.error("Could not parse wrangler.jsonc. Assuming it's empty/invalid.", e);
}

// Update settings based on .env
if (env.PROJECT_NAME) {
  wranglerConfig.name = env.PROJECT_NAME;
}
if (env.COMPATIBILITY_DATE) {
  wranglerConfig.compatibility_date = env.COMPATIBILITY_DATE;
}

if (!wranglerConfig.d1_databases) {
  wranglerConfig.d1_databases = [{}];
}

// Ensure only one DB is in the array to revert previous dual-db change
if (wranglerConfig.d1_databases.length > 1) {
    wranglerConfig.d1_databases = [wranglerConfig.d1_databases[0]];
}

if (env.D1_BINDING) {
  wranglerConfig.d1_databases[0].binding = env.D1_BINDING;
}
if (env.D1_DATABASE_NAME) {
  wranglerConfig.d1_databases[0].database_name = env.D1_DATABASE_NAME;
}
if (env.D1_DATABASE_ID) {
  wranglerConfig.d1_databases[0].database_id = env.D1_DATABASE_ID;
}

if (env.D1_REMOTE === 'true') {
  wranglerConfig.d1_databases[0].remote = true;
} else if (env.D1_REMOTE === 'false') {
  delete wranglerConfig.d1_databases[0].remote;
}

fs.writeFileSync(wranglerFile, JSON.stringify(wranglerConfig, null, '\t') + '\n', 'utf-8');
console.log('Successfully synced .env to wrangler.jsonc');
