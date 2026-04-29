import { mkdir, rm, cp, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist');

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

for (const file of ['index.html', 'styles.css', 'app.js']) {
  await cp(path.join(srcDir, file), path.join(distDir, file));
}

const config = {
  supabaseUrl: process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY',
};

const configJs = `window.STRENGTHLOG_CONFIG = ${JSON.stringify(config, null, 2)};\n`;
await writeFile(path.join(distDir, 'app-config.js'), configJs, 'utf8');

// Optional helper files for Cloudflare Pages / direct upload
const headers = [
  '/app-config.js',
  '  Cache-Control: no-store',
  '',
].join('\n');
await writeFile(path.join(distDir, '_headers'), headers, 'utf8');

console.log('Built dist/ with injected configuration placeholders.');
