<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useData } from 'vitepress'
// @ts-ignore
import titles from '../../../docs/.vitepress/.cache/sidebar-titles.json'

const route = useRoute()
const { isDark } = useData()

function syncTitles() {
  try {
    const root = document.querySelector('.VPSidebar')
    if (!root || !titles) return
    const links = root.querySelectorAll<HTMLAnchorElement>('a.VPLink.link')
    links.forEach(a => {
      const href = a.getAttribute('href') || ''
      const textEl = a.querySelector('.text') || a
      const t = titles[href]
      if (t && textEl && textEl.textContent !== t) {
        textEl.textContent = t
      }
    })
  } catch {}
}

onMounted(() => {
  syncTitles()
  // 监听路由/主题变化后再同步一次，确保 DOM 稳定
  watch(() => route.path, () => setTimeout(syncTitles, 0))
  watch(isDark, () => setTimeout(syncTitles, 0))
})
</script>

<template>
  <span style="display: none"></span>
  <!-- 纯副作用组件：运行时同步侧边栏文字 -->
</template>


