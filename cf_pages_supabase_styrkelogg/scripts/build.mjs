import { mkdir, rm, cp, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist');

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

for (const file of ['index.html', 'styles.css', 'app.js']) {
  await cp(path.join(srcDir, file), path.join(distDir, file));
}

// Avoid stale app code after a deploy
const headers = [
  '/*',
  '  Cache-Control: no-cache',
  '',
].join('\n');
await writeFile(path.join(distDir, '_headers'), headers, 'utf8');

console.log('Built dist/.');
