// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  vite: {
    define: {
      'import.meta.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY),
      'import.meta.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(env.FIREBASE_AUTH_DOMAIN),
      'import.meta.env.FIREBASE_PROJECT_ID': JSON.stringify(env.FIREBASE_PROJECT_ID),
    }
  }
});
