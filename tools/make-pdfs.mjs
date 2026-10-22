// Renders the print pages to PDF/PNG in public/downloads.
// 1) start the dev server:  npm run dev
// 2) in a second terminal:  npm run pdfs
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = process.env.SITE_URL || 'http://localhost:4321';
const OUT = new URL('../public/downloads/', import.meta.url);
const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(existsSync);
if (!EDGE) throw new Error('Microsoft Edge or Chrome not found');

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage();
const pdf = async (path, file, landscape = false) => {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle0' });
  await page.pdf({ path: fileURLToPath(new URL(file, OUT)), format: 'letter', landscape, printBackground: true, preferCSSPageSize: true });
  console.log('✓', file);
};
await pdf('/print/plan', 'UFV-SkyGrid-High-Level-Plan.pdf');
await pdf('/print/gantt', 'UFV-SkyGrid-Gantt.pdf', true);
await pdf('/print/decision-pack', 'UFV-SkyGrid-Decision-Pack.pdf');

await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });
await page.goto(`${BASE}/print/gantt`, { waitUntil: 'networkidle0' });
const el = await page.$('body');
await el.screenshot({ path: fileURLToPath(new URL('UFV-SkyGrid-Gantt.png', OUT)) });
console.log('✓ UFV-SkyGrid-Gantt.png');
await browser.close();
