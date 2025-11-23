<script lang="ts" setup>
import { ref } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import md5 from 'blueimp-md5'

import Copyright from './Copyright.vue'
import SidebarTitleSync from './SidebarTitleSync.vue'
import AnchorPreview from '../anchor/AnchorPreview.vue'
import { useAnchorPreview } from '../anchor/useAnchorPreview'

const { Layout } = DefaultTheme
const { page, theme, frontmatter } = useData()

const anchorPreviewRef = ref<InstanceType<typeof AnchorPreview> | null>(null)

function showAnchorPreview(title: string, content: string) {
  anchorPreviewRef.value?.show(title, content)
}

useAnchorPreview(showAnchorPreview)
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
      <AnchorPreview ref="anchorPreviewRef" />
</template>

