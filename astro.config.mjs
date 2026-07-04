import { defineConfig } from 'astro/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// We need to pass a config object, extending won't work in the way we want directly
// but since the original was just mjs, we can just export from config.
export { default } from "./config/astro.config.mjs";
