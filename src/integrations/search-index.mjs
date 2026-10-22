// Site-wide search index. Reads the rendered HTML of every page and writes
// search-index.json: one entry per page plus one per section heading (h2/h3).
// Built automatically on `npm run build`, and served on the fly by `npm run dev`.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKIP = /^print\//; // printable PDF sources duplicate the real pages
const MAX_TEXT = 1500;
const MAX_PAGE_TEXT = 4000;

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '’', nbsp: ' ', '#39': '’' };
const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&([a-z]+|#39);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
const strip = (html) => decode(html
  .replace(/<(script|style|svg|template|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const attr = (attrs, name) => attrs.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

/** Turns one rendered page into index entries. `path` is relative to the site base, e.g. "plan/charter/". */
export function indexPage(path, html) {
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '').split(/ · | — /)[0].trim();
  const pageTitle = path === '' ? 'Home — The Pitch' : title;
  const main = html.match(/<main\b[^>]*>([\s\S]*)<\/main>/)?.[1] ?? '';
  const clean = main.replace(/<(script|style|svg|template|noscript)\b[\s\S]*?<\/\1>/gi, ' ');

  // Positions of every element that carries an id, so a heading can link to its nearest section.
  const anchors = [...clean.matchAll(/<(section|article|div|h[1-3])\b([^>]*\bid="([^"]+)"[^>]*)>/g)]
    .map((m) => ({ at: m.index, id: m[3] }));
  const heads = [...clean.matchAll(/<(h[1-3])\b([^>]*)>([\s\S]*?)<\/\1>/g)]
    .map((m) => ({ at: m.index, end: m.index + m[0].length, level: m[1], id: attr(m[2], 'id'), text: strip(m[3]) }))
    .filter((h) => h.text);

  // Page entry: everything after the page title (skips breadcrumbs), so any word on the page finds it.
  const h1 = heads.find((h) => h.level === 'h1');
  const entries = [{ type: 'page', path, page: pageTitle, heading: pageTitle, anchor: '', text: strip(clean.slice(h1?.end ?? 0)).slice(0, MAX_PAGE_TEXT) }];
  heads.forEach((h, i) => {
    if (h.level === 'h1') return;
    const anchor = h.id ?? [...anchors].reverse().find((a) => a.at <= h.at)?.id ?? '';
    const text = strip(clean.slice(h.end, heads[i + 1]?.at ?? h.end + 6000)).slice(0, MAX_TEXT);
    entries.push({ type: 'section', path, page: pageTitle, heading: h.text, anchor, text });
  });
  return entries;
}

async function htmlFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await htmlFiles(p));
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

const routeOf = (rel) => rel.split(sep).join('/').replace(/index\.(html|astro)$/, '').replace(/\.astro$/, '/');

export default function searchIndex() {
  let base = '/';
  return {
    name: 'skygrid-search-index',
    hooks: {
      'astro:config:done': ({ config }) => { base = config.base.endsWith('/') ? config.base : `${config.base}/`; },

      'astro:build:done': async ({ dir }) => {
        const root = fileURLToPath(dir);
        const entries = [];
        for (const f of await htmlFiles(root)) {
          const path = routeOf(relative(root, f));
          if (SKIP.test(path)) continue;
          entries.push(...indexPage(path, await readFile(f, 'utf8')));
        }
        await writeFile(join(root, 'search-index.json'), JSON.stringify(entries));
      },

      // Dev server: build the index on request by rendering each page through the server itself.
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.split('?')[0] !== `${base}search-index.json`) return next();
          try {
            const pagesDir = fileURLToPath(new URL('../pages/', import.meta.url));
            const files = (await readdir(pagesDir, { recursive: true })).filter((f) => f.endsWith('.astro'));
            const entries = [];
            for (const f of files) {
              const path = routeOf(f);
              if (SKIP.test(path)) continue;
              const r = await fetch(`http://${req.headers.host}${base}${path}`);
              if (r.ok) entries.push(...indexPage(path, await r.text()));
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(entries));
          } catch (err) { next(err); }
        });
      },
    },
  };
}
