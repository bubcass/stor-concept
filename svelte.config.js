import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const base = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false,
      // Allow the local-only publish endpoint to exist in dev without
      // blocking static GitHub Pages builds, where that route is unavailable.
      strict: false
    }),
    paths: {
      base
    }
  }
};

export default config;
