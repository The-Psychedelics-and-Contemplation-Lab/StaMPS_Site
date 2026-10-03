import { defineConfig } from 'astro/config';
import { site } from './src/site.config';
// While the site is tested on github.io it lives under /<repo>/ ; once the
// custom domain is switched on, set PUBLIC_SITE_BASE="" in the workflow.
const base = process.env.PUBLIC_SITE_BASE ?? site.base;
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? site.previewUrl,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: true,
});
