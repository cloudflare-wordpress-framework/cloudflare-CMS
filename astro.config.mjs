// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { loadEnv } from 'vite';

import vue from '@astrojs/vue';

const env = loadEnv('', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  output: 'server',

  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      configPath: 'wrangler.jsonc'
    }
  }),

  vite: {
    define: {
      'import.meta.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY),
      'import.meta.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(env.FIREBASE_AUTH_DOMAIN),
      'import.meta.env.FIREBASE_PROJECT_ID': JSON.stringify(env.FIREBASE_PROJECT_ID),
      'import.meta.env.ADMIN_EMAILS': JSON.stringify(env.ADMIN_EMAILS),
      'import.meta.env.EDITOR_EMAILS': JSON.stringify(env.EDITOR_EMAILS),
    }
  },

  integrations: [vue()]
});