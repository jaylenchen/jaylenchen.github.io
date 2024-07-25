import Components from 'unplugin-vue-components/vite';
import svgLoader from 'vite-svg-loader'
import { title, description } from './title'
import { head } from './head'
import { DefaultTheme, UserConfig } from 'vitepress'
import { markdown } from './markdown';
import { customElements } from './custom-elements'
import { resolve } from "node:path"


const docsConfig: UserConfig<DefaultTheme.Config> = {
  lang: 'zh-CN',
  title,
  description,
  head,
  appearance: false
}


const buildConfig: UserConfig<DefaultTheme.Config> = {
  base: '/',
  srcDir: resolve(__dirname, '../../../docs/src'),
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
      svgLoader()
    ],
    resolve: {
      alias: {
        'mermaid': 'mermaid/dist/mermaid.esm.mjs',
        "@blog/config": resolve(__dirname),
        "@blog/docs": resolve(__dirname, "../../../docs/src"),
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
