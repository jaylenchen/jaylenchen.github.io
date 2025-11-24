<script lang="ts" setup>
import { ref, defineAsyncComponent, watch, onMounted, provide } from 'vue'
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

// 加载文章内容的函数（复用 useArticlePreview 的逻辑）
async function loadArticleForPreview(articlePath: string): Promise<{ title: string; content: string } | null> {
  return new Promise((resolve) => {
    try {
      // 规范化路径
      let fullPath = articlePath.startsWith('/') ? articlePath : `/${articlePath}`
      fullPath = fullPath.replace(/\/$/, '')
      
      // 创建隐藏的 iframe 来加载页面
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position: absolute; left: -9999px; top: -9999px; width: 1px; height: 1px; border: none; visibility: hidden;'
      
      let loaded = false
      const timeout = setTimeout(() => {
        if (!loaded) {
          loaded = true
          if (iframe.parentNode) {
            document.body.removeChild(iframe)
          }
          resolve(null)
        }
      }, 60000) // 60 秒超时
      
      iframe.onload = () => {
        if (loaded) return
        
        try {
          const iframeDoc = iframe.contentDocument || (iframe.contentWindow as any)?.document
          if (!iframeDoc) {
            if (!loaded) {
              loaded = true
              clearTimeout(timeout)
              if (iframe.parentNode) {
                document.body.removeChild(iframe)
              }
              resolve(null)
            }
            return
          }
          
          // 等待 VitePress 和 Vue 组件渲染完成
          let checkCount = 0
          const maxChecks = 15 // 最多检查 15 次（3 秒）
          
          const checkContent = () => {
            checkCount++
            const contentElement = iframeDoc.querySelector('.vp-doc')
            
            // 检查内容是否已渲染（至少有一个 h1 或段落）
            const hasContent = contentElement && (
              contentElement.querySelector('h1') || 
              contentElement.querySelector('p') ||
              contentElement.children.length > 0
            )
            
            if (hasContent && checkCount > 2) {
              // 内容已渲染，等待一小段时间确保完整
              setTimeout(() => {
                if (!loaded) {
                  loaded = true
                  clearTimeout(timeout)
                  const extracted = extractContentFromDocument(iframeDoc, fullPath)
                  if (iframe.parentNode) {
                    document.body.removeChild(iframe)
                  }
                  resolve(extracted)
                }
              }, 300)
            } else if (checkCount < maxChecks) {
              // 如果内容还没渲染，继续等待
              setTimeout(checkContent, 200)
            } else {
              // 超时，尝试提取已有内容
              if (!loaded) {
                loaded = true
                clearTimeout(timeout)
                const extracted = extractContentFromDocument(iframeDoc, fullPath)
                if (iframe.parentNode) {
                  document.body.removeChild(iframe)
                }
                resolve(extracted)
              }
            }
          }
          
          // 初始等待 500ms，然后开始检查
          setTimeout(checkContent, 500)
        } catch (error) {
          console.error('Failed to extract content from iframe:', error)
          if (!loaded) {
            loaded = true
            clearTimeout(timeout)
            if (iframe.parentNode) {
              document.body.removeChild(iframe)
            }
            resolve(null)
          }
        }
      }
      
      iframe.onerror = () => {
        if (loaded) return
        loaded = true
        clearTimeout(timeout)
        if (iframe.parentNode) {
          document.body.removeChild(iframe)
        }
        resolve(null)
      }
      
      iframe.src = fullPath
      document.body.appendChild(iframe)
    } catch (error) {
      console.error('Failed to load article content:', error)
      resolve(null)
    }
  })
}

// 从文档中提取文章标题和内容
function extractContentFromDocument(doc: Document, articlePath?: string): { title: string; content: string } | null {
  // 查找文章标题（通常是 h1 或 .vp-doc h1）
  const titleElement = doc.querySelector('h1, .vp-doc h1, .VPContent h1, main h1')
  const title = titleElement?.textContent?.trim() || '文章预览'
  
  // 查找文章内容区域
  const contentElement = doc.querySelector('.vp-doc, .VPContent main, main .vp-doc')
  if (!contentElement) {
    return null
  }
  
  // 克隆内容元素
  const clonedContent = contentElement.cloneNode(true) as HTMLElement
  
  // 移除导航、侧边栏等不需要的元素
  clonedContent.querySelectorAll('nav, .VPSidebar, .VPNav, header, footer, .ArticleMetadata').forEach(el => el.remove())
  
  // 如果提供了文章路径，将第一个 h1 标题转换为可点击链接
  if (articlePath && titleElement) {
    const h1InContent = clonedContent.querySelector('h1')
    if (h1InContent) {
      // 规范化路径
      let fullPath = articlePath.startsWith('/') ? articlePath : `/${articlePath}`
      fullPath = fullPath.replace(/\/$/, '')
      
      // 创建链接包装 h1 的内容
      const link = document.createElement('a')
      link.href = fullPath
      link.style.cssText = 'text-decoration: none; color: inherit; display: inline;'
      link.title = '点击跳转到完整文章'
      
      // 复制 h1 的所有子节点到链接
      while (h1InContent.firstChild) {
        link.appendChild(h1InContent.firstChild)
      }
      
      // 替换 h1 内容为链接
      h1InContent.innerHTML = ''
      h1InContent.appendChild(link)
      
      // 添加样式类，方便后续样式化
      h1InContent.classList.add('article-preview-title-link')
    }
  }
  
  // 限制内容长度（显示前 3 个标题及其内容，最多 25 个元素）
  const allElements = Array.from(clonedContent.children)
  let elementCount = 0
  let headingCount = 0
  const maxElements = 25
  const maxHeadings = 3
  
  const filteredElements: Element[] = []
  for (const el of allElements) {
    if (elementCount >= maxElements) break
    
    // 如果是标题元素
    if (el.tagName.match(/^H[1-6]$/)) {
      if (headingCount >= maxHeadings && headingCount > 0) {
        break
      }
      headingCount++
    }
    
    filteredElements.push(el)
    elementCount++
  }
  
  // 创建新的容器，只包含过滤后的元素
  const container = document.createElement('div')
  container.className = 'article-preview-extracted-content'
  filteredElements.forEach(el => container.appendChild(el.cloneNode(true)))
  
  // 如果内容被截断了，添加提示
  if (elementCount < allElements.length) {
    const moreHint = document.createElement('p')
    moreHint.className = 'article-preview-more-hint'
    moreHint.style.cssText = 'color: var(--vp-c-text-2); font-style: italic; margin-top: 1rem; text-align: center;'
    moreHint.textContent = '...'
    container.appendChild(moreHint)
  }
  
  return {
    title,
    content: container.innerHTML
  }
}

// 提供 preview 引用和加载函数，供 Tags.vue 等组件使用
provide('articlePreview', articlePreviewRef)
provide('loadArticleForPreview', loadArticleForPreview)

// 将加载函数也传递给 useArticlePreview（通过修改 showArticlePreview 来包含加载函数）
// 但更好的方式是直接修改 useArticlePreview 来接收加载函数
useArticlePreview(showArticlePreview, loadArticleForPreview)

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
    requestAnimationFrame(() => {
      const path = route.path
      const isTagsPage = path?.startsWith('/tags')
      
      if (isTagsPage) {
        const newTag = getTagParam()
        if (currentTag.value !== newTag) {
          // tag切换了，关闭预览窗口
          if (articlePreviewRef.value?.visible) {
            articlePreviewRef.value.close()
          }
          currentTag.value = newTag
        } else {
          currentTag.value = newTag
        }
      } else {
        const newTagParam = getTagParam()
        currentTag.value = newTagParam
      }
    })
  }
  
  window.history.replaceState = function(...args) {
    originalReplaceState.apply(window.history, args)
    
    // 延迟检查，确保URL已更新
    requestAnimationFrame(() => {
      const path = route.path
      const isTagsPage = path?.startsWith('/tags')
      
      if (isTagsPage) {
        const newTagParam = getTagParam()
        if (currentTag.value !== newTagParam) {
          // tag切换了，关闭预览窗口
          if (articlePreviewRef.value?.visible) {
            articlePreviewRef.value.close()
          }
          currentTag.value = newTagParam
        } else {
          currentTag.value = newTagParam
        }
      } else {
        const newTagParam = getTagParam()
        currentTag.value = newTagParam
      }
    })
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

