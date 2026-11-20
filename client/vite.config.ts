import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/** Starts the landing hero's background download from index.html, in
 *  parallel with the JS bundle, instead of only once React has mounted.
 *  Picks AVIF or WebP with the same test as src/lib/backgrounds.ts so the
 *  preloaded URL is the one the page then uses. Build only: in dev the asset
 *  URLs aren't fingerprinted and there's nothing to win. */
function preloadHeroBackground(): Plugin {
  let base = '/';
  return {
    name: 'dl70-preload-hero-bg',
    apply: 'build',
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml(html, ctx) {
      const find = (file: string) =>
        Object.values(ctx.bundle ?? {}).find(
          (c) => c.type === 'asset' && (c.names ?? [c.name]).includes(file)
        )?.fileName;
      const avif = find('hero-building.avif');
      const webp = find('hero-building.webp');
      if (!avif || !webp) return html;
      const script =
        `(function(){var a=window.CSS&&CSS.supports&&CSS.supports('background-image','image-set(url("x.avif") type("image/avif"))');` +
        `var l=document.createElement('link');l.rel='preload';l.as='image';l.fetchPriority='high';` +
        `l.href=${JSON.stringify(base + avif)};if(!a)l.href=${JSON.stringify(base + webp)};document.head.appendChild(l)})()`;
      return [{ tag: 'script', children: script, injectTo: 'head' }];
    }
  };
}

export default defineConfig({
  plugins: [react(), preloadHeroBackground()],
  server: {
    port: 5173
  }
});
