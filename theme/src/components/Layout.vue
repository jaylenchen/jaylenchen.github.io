<script lang="ts" setup>
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import md5 from 'blueimp-md5'

import Copyright from './Copyright.vue'
import SidebarTitleSync from './SidebarTitleSync.vue'

const { Layout } = DefaultTheme
const { page, theme, frontmatter } = useData()
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
</template>

