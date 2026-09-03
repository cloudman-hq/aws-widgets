import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const entrypoints = ['macro-view', 'macro-config', 'global-settings'] as const;

export default defineConfig(({ mode }) => {
  if (!entrypoints.includes(mode as (typeof entrypoints)[number])) {
    throw new Error(`Unsupported frontend entrypoint: ${mode}`);
  }

  return {
    root: resolve(import.meta.dirname, 'frontend', mode),
    build: {
      emptyOutDir: false,
      outDir: resolve(import.meta.dirname, 'dist', mode),
      sourcemap: true,
    },
  };
});
