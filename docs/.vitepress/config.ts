import { defineConfig } from 'vitepress'
// @ts-ignore
import { withMermaid } from 'vitepress-plugin-mermaid';
import { themeConfig } from './theme-config/theme-config';
import { siteConfig } from './site-config/site-config';


export default withMermaid(defineConfig({
  themeConfig,
  ...siteConfig,
}))
