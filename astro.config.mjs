// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import optimize from './integrations/optimize.mjs';

// https://astro.build/config
export default defineConfig({
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      i18n: { defaultLocale: 'es', locales: { es: 'es-CO', en: 'en-US' } }
    }),
    optimize()
  ],
  site: 'https://jaquito.art',
  compressHTML: true,
  build: {
    // El CSS es pequeño: va dentro del HTML y no bloquea con una petición extra.
    inlineStylesheets: 'always'
  },
  devToolbar: { enabled: false }
});
