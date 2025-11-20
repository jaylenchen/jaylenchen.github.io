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
  <div class="app-shell">
    <div class="app-shell__content">
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
    </div>
    <footer class="global-footer">
      © 2025 Jaylenchen. All rights reserved.
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
  border-bottom: 1px solid rgba(24, 144, 255, 0.35);
  padding-bottom: 1px;
}

.global-footer a:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}
</style>

