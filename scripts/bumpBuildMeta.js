/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

try {
  const target = path.join(__dirname, '..', 'client', 'src', 'buildMeta.ts');
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const tag = `stg-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const iso = now.toISOString();

  const content = `export const BUILD_META = {\n  commit: '${tag}',\n  // ISO timestamp when this build meta was updated\n  time: '${iso}'\n};\n`;
  fs.writeFileSync(target, content, 'utf8');
  console.log('Updated build meta:', { tag, iso, target });
} catch (err) {
  console.error('Failed to update build meta:', err);
  process.exit(1);
}


