/**
 * Turn the built dist/index.html into dist/artifact.html for publishing as a claude.ai artifact:
 * the viewer adds its own doctype, <html>, <head> and <body>, so the page keeps only their contents.
 * Run after `vite build` (see `npm run build:artifact`).
 */
import { readFile, writeFile } from 'node:fs/promises';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const inner = (tag) => html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*)</${tag}>`))?.[1] ?? '';

const head = inner('head')
  .replace(/<meta charset[^>]*>\s*/i, '')
  .replace(/<meta name="viewport"[^>]*>\s*/i, '');
const title = head.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '';
const page = `${title}\n${head.replace(title, '').trim()}\n${inner('body').trim()}\n`;

await writeFile(new URL('../dist/artifact.html', import.meta.url), page);
console.log('dist/artifact.html written');
