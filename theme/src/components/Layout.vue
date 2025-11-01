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
      | Copyright © 2020-2025
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-shell__content {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  background: transparent;
  position: relative;
  z-index: 0;
}

.global-footer {
  flex-shrink: 0;
  margin: 3rem auto 2.6rem;
  padding: 0.6rem 0;
  width: 100%;
  text-align: center;
  font-size: 0.9rem;
  color: var(--vp-c-text-3);
  background: transparent;
  border: none;
  box-shadow: none;
}

.global-footer a {
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid rgba(120, 150, 220, 0.35);
  padding-bottom: 1px;
}

.global-footer a:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}
</style>

