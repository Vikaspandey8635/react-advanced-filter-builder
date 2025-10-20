import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true,
  minify: true,
  target: 'es2020',
  banner: {
    js: '/* react-advanced-filter-builder | MIT License | https://github.com/yourusername/react-advanced-filter-builder */',
  },
});
