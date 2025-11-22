import DefaultTheme from 'vitepress/theme'
import Layout from './components/Layout.vue';
import ArticleMetadata from './components/ArticleMetadata.vue'

import theme from 'vitepress/theme'
// 直接导入所有 CSS 文件，确保生产环境正确加载
import './styles/vars.css';
import './styles/theme-colors.css';
import './styles/fonts.css';
import './styles/base.css';
import './styles/nav.css';
import './styles/search.css';
import './styles/menu.css';
import './styles/sidebar.css';
import './styles/outline.css';
import './styles/doc-content.css';
import './styles/doc-blocks.css';
import './styles/code.css';
import './styles/mermaid.css';
import './styles/footer.css';
import './styles/scrollbar.css';
import './styles/utils.css';
import './styles/responsive.css';

import type { EnhanceAppContext } from 'vitepress';
import type { DefineComponent } from 'vue';

export default {
  ...DefaultTheme,
  Layout: Layout as  DefineComponent,
  enhanceApp({ app }: EnhanceAppContext) {
    app.component("ArticleMetadata", ArticleMetadata)
  }
} satisfies typeof theme
