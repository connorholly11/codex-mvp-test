const fs = require('node:fs');
const path = require('node:path');

function loadEnvFile(filepath) {
  if (!fs.existsSync(filepath)) {
    return;
  }

  const contents = fs.readFileSync(filepath, 'utf8');
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    if (!key || key.startsWith('#')) {
      continue;
    }

    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith('\'') && value.endsWith('\''))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const repoRoot = path.resolve(__dirname, '..');
loadEnvFile(path.join(repoRoot, '.env.local'));
loadEnvFile(path.join(repoRoot, '.env'));
loadEnvFile(path.join(repoRoot, 'apps', 'web', '.env.local'));
