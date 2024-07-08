<script lang="ts" setup>
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import md5 from 'blueimp-md5'
import Comment from './Comment.vue'
import Copyright from './Copyright.vue'

const { Layout } = DefaultTheme
const { page, theme, frontmatter } = useData()
</script>

<template>
  <Layout>
    <template #doc-footer-before>
      <Copyright
        v-if="(frontmatter?.aside ?? true) && (frontmatter?.showArticleMetadata ?? true) && !(frontmatter.authorLink)"
        :key="md5(page.relativePath)" />
    </template>
    <template #doc-after>
      <Comment v-if="(theme.commentConfig?.showComment ?? true) && (frontmatter?.showComment ?? true)"
        :key="md5(page.relativePath)" :comment-config="theme.commentConfig" />
    </template>
  </Layout>
</template>
