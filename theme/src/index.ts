import DefaultTheme from 'vitepress/theme'
import Layout from './components/Layout.vue';
import ArticleMetadata from './components/ArticleMetadata.vue'

import theme from 'vitepress/theme'
// 直接导入所有 CSS 文件，确保生产环境正确加载

import './styles/overrides.css';
import './styles/vars.css';

import type { EnhanceAppContext } from 'vitepress';
import type { DefineComponent } from 'vue';

export default {
  ...DefaultTheme,
  Layout: Layout as  DefineComponent,
  enhanceApp({ app }: EnhanceAppContext) {
    app.component("ArticleMetadata", ArticleMetadata)
  }
} satisfies typeof theme
