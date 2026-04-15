// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en', 'de'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    },
  },
  site: 'https://postcompare.eu',
});
