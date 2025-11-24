<script lang="ts" setup>
import { ref, defineAsyncComponent } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import md5 from 'blueimp-md5'

import Copyright from './Copyright.vue'
import SidebarTitleSync from './SidebarTitleSync.vue'
import { useArticlePreview } from '../preview/useArticlePreview'

// 使用异步组件避免构建时的循环依赖问题
const ArticlePreview = defineAsyncComponent(() => import('../preview/ArticlePreview.vue'))

const { Layout } = DefaultTheme
const { page, theme, frontmatter } = useData()

const articlePreviewRef = ref<any>(null)

function showArticlePreview(title: string, content: string) {
  articlePreviewRef.value?.show(title, content)
}

useArticlePreview(showArticlePreview)
</script>

<template>
      <Layout>
        <template #sidebar-nav-after>
          <SidebarTitleSync />
        </template>
        <template #doc-footer-before>
          <Copyright
            v-if="(frontmatter?.aside ?? true) && (frontmatter?.showArticleMetadata ?? true) && !(frontmatter.authorLink)"
            :key="md5(page.relativePath)" />
        </template>
      </Layout>
      <ArticlePreview ref="articlePreviewRef" />
</template>

