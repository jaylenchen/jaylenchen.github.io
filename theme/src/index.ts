import DefaultTheme from 'vitepress/theme'
import Layout from './components/Layout.vue';
import ArticleMetadata from './components/ArticleMetadata.vue'

import theme from 'vitepress/theme'

// 按需导入 ant-design-vue 样式，而不是整个 reset.css
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
