import DefaultTheme from 'vitepress/theme'
import Layout from './components/Layout.vue';
import ArticleMetadata from './components/ArticleMetadata.vue'

import theme from 'vitepress/theme'

import "ant-design-vue/dist/reset.css";
import './styles/vars.css';
import './styles/custom.css';

import type { EnhanceAppContext } from 'vitepress';
import type { DefineComponent } from 'vue';

export default {
  ...DefaultTheme,
  Layout: Layout as  DefineComponent,
  enhanceApp({ app }: EnhanceAppContext) {
    app.component("ArticleMetadata", ArticleMetadata)
  }
} satisfies typeof theme
