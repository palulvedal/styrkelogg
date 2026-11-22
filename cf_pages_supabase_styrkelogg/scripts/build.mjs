import { mkdir, rm, cp, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist');

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

// Copy everything in src/ (HTML, CSS, JS, manifest and icons).
await cp(srcDir, distDir, { recursive: true });

// Avoid stale app code after a deploy
const headers = [
  '/*',
  '  Cache-Control: no-cache',
  '',
].join('\n');
await writeFile(path.join(distDir, '_headers'), headers, 'utf8');

console.log('Built dist/.');
