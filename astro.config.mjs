// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// On GitHub Pages the site lives at https://<user>.github.io/<repo>/
// The deploy workflow passes SITE and BASE_PATH; locally both default to "/".
export default defineConfig({
  site: process.env.SITE || 'http://localhost:4321',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  // GitHub Pages ignores folders starting with "_", so don't use Astro's default "_astro".
  build: { assets: 'assets' },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    // Pre-bundle every client library up front so the dev server never has to
    // re-optimize mid-session (which breaks pages with "504 Outdated Optimize Dep").
    optimizeDeps: {
      // (React itself is handled by @astrojs/react; listing it here loads two copies.)
      include: ['lenis', 'fuse.js'],
    },
  },
});
