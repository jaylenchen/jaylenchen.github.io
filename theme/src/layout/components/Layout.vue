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
  <div class="app-shell">
    <div class="app-shell__content">
      <Layout>
        <template #doc-footer-before>
          <Copyright
            v-if="(frontmatter?.aside ?? true) && (frontmatter?.showArticleMetadata ?? true) && !(frontmatter.authorLink)"
            :key="md5(page.relativePath)" />
        </template>
        <template #doc-after>
          <Comment
            v-if="(theme.commentConfig?.showComment ?? true) && (frontmatter?.showComment ?? true)"
            :key="md5(page.relativePath)"
            :comment-config="theme.commentConfig"
          />
        </template>
      </Layout>
    </div>
    <footer class="global-footer">
      Powered by <a href="https://github.com/jaylenchen" target="_blank" rel="noopener">jaylenchen</a>
      | Copyright © 2020-2025 | MIT License
    </footer>
  </div>
</template>
