// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [react(), sitemap({
    i18n: {
      defaultLocale: 'fr',
      locales: {
        fr: 'fr',
        en: 'en',
        de: 'de',
      },
    },
  })],
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en', 'de'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  site: 'https://www.postcompare.eu',
});
