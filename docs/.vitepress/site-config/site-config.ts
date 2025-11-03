import Components from 'unplugin-vue-components/vite';
import svgLoader from 'vite-svg-loader'
import { title, description } from './title'
import { head } from './head'
import { DefaultTheme, UserConfig } from 'vitepress'
import { markdown } from './markdown';
import { customElements } from './custom-elements'
import { resolve } from "node:path"
import { copyAssetsToPublic } from '../plugins/copy-assets-to-public'
import { watchIncludedMarkdown } from '../plugins/watch-includes.ts'


const docsConfig: UserConfig<DefaultTheme.Config> = {
  lang: 'zh-CN',
  title,
  description,
  head,
  appearance: false
}


const buildConfig: UserConfig<DefaultTheme.Config> = {
  base: '/',
  srcDir: resolve(__dirname, '../../src'),
  rewrites: {
    'technology/project/gepick/index.md': 'technology/project/gepick.md',
    'technology/project/openwizard/index.md': 'technology/project/openwizard.md',
    'technology/project/thinkto/index.md': 'technology/project/thinkto.md',
    'technology/project/tsalg/index.md': 'technology/project/tsalg.md',
    'technology/common/docker/index.md': 'technology/common/docker.md',
    'technology/common/rust/index.md': 'technology/common/rust.md',
    'technology/common/mermaid/index.md': 'technology/common/mermaid.md',
    'technology/common/github/index.md': 'technology/common/github.md',
    'life/index.md': 'life.md'
  },
  markdown,
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => customElements.includes(tag),
      },
    },
  },
  vite: {
    plugins: [
      Components({
        dirs: ['.vitepress/theme/components'],
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      }),
      svgLoader(),
      watchIncludedMarkdown(),
      copyAssetsToPublic()
    ],
    resolve: {
      alias: {
        'mermaid': 'mermaid/dist/mermaid.esm.mjs',
        "@blog/docs": resolve(__dirname, "../../src"),
        "@blog/theme": resolve(__dirname, "../../../theme/src"),
      },
    },
  }
}


export const siteConfig: Omit<UserConfig<DefaultTheme.Config>, 'themeConfig'> = {
  ...docsConfig,
  ...buildConfig,
  cleanUrls: true,
}
