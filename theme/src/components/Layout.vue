<script lang="ts" setup>
import { ref, defineAsyncComponent, watch, onMounted } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { useData, useRoute } from 'vitepress'
import md5 from 'blueimp-md5'

import Copyright from './Copyright.vue'
import SidebarTitleSync from './SidebarTitleSync.vue'
import { useArticlePreview } from '../preview/useArticlePreview'

// 使用异步组件避免构建时的循环依赖问题
const ArticlePreview = defineAsyncComponent(() => import('../preview/ArticlePreview.vue'))

const { Layout } = DefaultTheme
const { page, theme, frontmatter } = useData()
const route = useRoute()

const articlePreviewRef = ref<any>(null)

function showArticlePreview(title: string, content: string) {
  articlePreviewRef.value?.show(title, content)
}

useArticlePreview(showArticlePreview)

// 获取URL中的tag参数
function getTagParam(): string | null {
  if (typeof window === 'undefined') return null
  const url = new URL(window.location.href)
  return url.searchParams.get('tag')
}

// 当前tag参数的ref，用于监听变化
const currentTag = ref<string | null>(null)

// 监听路由变化，自动关闭预览窗口
// 但在标签页内切换文章时，不关闭（让预览内容自动更新）
// 当切换tag时，需要关闭预览窗口
watch(() => [route.path, window.location?.search], ([newPath, newSearch], [oldPath, oldSearch]) => {
  if (!articlePreviewRef.value || !articlePreviewRef.value.visible) {
    // 更新当前tag参数
    currentTag.value = getTagParam()
    return
  }
  
  const isNewTagsPage = newPath?.startsWith('/tags')
  const isOldTagsPage = oldPath?.startsWith('/tags')
  
  // 如果路径发生变化
  if (newPath !== oldPath) {
    // 如果都在标签页（/tags），不关闭，让预览内容自动更新
    if (isNewTagsPage && isOldTagsPage) {
      // 在标签页内切换文章（路径相同但可能是不同的文章），让链接点击逻辑处理预览更新
      currentTag.value = getTagParam()
      return
    }
    
    // 其他情况都关闭：从其他页面切换到标签页，或从标签页切换到其他页面，或在不同页面之间切换
    articlePreviewRef.value.close()
    currentTag.value = getTagParam()
    return
  }
  
  // 如果路径相同但查询参数变化（特别是tag参数变化）
  // 如果在标签页且tag参数发生变化，关闭预览窗口
  if (isNewTagsPage && isOldTagsPage) {
    const newTag = getTagParam()
    if (currentTag.value !== newTag) {
      articlePreviewRef.value.close()
      currentTag.value = newTag
      return
    }
  }
  
  // 更新当前tag参数
  currentTag.value = getTagParam()
})

// 监听popstate和pushState/replaceState，处理tag切换
onMounted(() => {
  // 初始化当前tag参数
  currentTag.value = getTagParam()
  
  // 监听popstate事件（浏览器前进/后退）
  const handlePopState = () => {
    if (!articlePreviewRef.value || !articlePreviewRef.value.visible) {
      currentTag.value = getTagParam()
      return
    }
    
    const path = route.path
    const isTagsPage = path?.startsWith('/tags')
    
    if (isTagsPage) {
      const newTag = getTagParam()
      if (currentTag.value !== newTag) {
        articlePreviewRef.value.close()
        currentTag.value = newTag
      }
    }
  }
  
  window.addEventListener('popstate', handlePopState)
  
  // 拦截pushState和replaceState，检测tag切换
  const originalPushState = window.history.pushState
  const originalReplaceState = window.history.replaceState
  
  window.history.pushState = function(...args) {
    originalPushState.apply(window.history, args)
    
    // 延迟检查，确保URL已更新
    setTimeout(() => {
      if (!articlePreviewRef.value || !articlePreviewRef.value.visible) {
        currentTag.value = getTagParam()
        return
      }
      
      const path = route.path
      const isTagsPage = path?.startsWith('/tags')
      
      if (isTagsPage) {
        const newTag = getTagParam()
        if (currentTag.value !== newTag) {
          articlePreviewRef.value.close()
          currentTag.value = newTag
        }
      }
    }, 0)
  }
  
  window.history.replaceState = function(...args) {
    originalReplaceState.apply(window.history, args)
    
    // 延迟检查，确保URL已更新
    setTimeout(() => {
      if (!articlePreviewRef.value || !articlePreviewRef.value.visible) {
        currentTag.value = getTagParam()
        return
      }
      
      const path = route.path
      const isTagsPage = path?.startsWith('/tags')
      
      if (isTagsPage) {
        const newTag = getTagParam()
        if (currentTag.value !== newTag) {
          articlePreviewRef.value.close()
          currentTag.value = newTag
        }
      }
    }, 0)
  }
  
  // 清理函数
  return () => {
    window.removeEventListener('popstate', handlePopState)
    window.history.pushState = originalPushState
    window.history.replaceState = originalReplaceState
  }
})
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

