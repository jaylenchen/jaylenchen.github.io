<template>
  <Teleport to="body">
    <Transition name="fade">
      <div 
        v-if="visible" 
        class="article-preview-overlay" 
        @click.self="handleOverlayClick"
        @mousedown="handleOverlayMouseDown"
      >
        <div 
          class="article-preview-card" 
          :class="{ 'article-preview-card--tags-page': isTagsPage }"
          :style="cardStyle"
          @click.stop
          @mousedown="handleMouseDown"
        >
          <div class="article-preview-content-wrapper">
            <button class="article-preview-close-content" @click="close" aria-label="关闭">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div 
              class="article-preview-content vp-doc" 
              ref="contentRef" 
              v-html="content"
              @click="handleContentClick"
            ></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue'
import { useData, useRoute } from 'vitepress'

const { isDark } = useData()

const visible = ref(false)
const title = ref('')
const content = ref('')
const contentRef = ref<HTMLElement | null>(null)

// 拖拽相关状态
const position = ref({ x: 0, y: 0 }) // 初始位置（页面最顶部）
const isDragging = ref(false)
const dragStart = ref({ 
  mouseX: 0, // 鼠标/触摸按下时的 clientX
  mouseY: 0, // 鼠标/触摸按下时的 clientY
  positionX: 0, // 弹窗按下时的 position.x
  positionY: 0 // 弹窗按下时的 position.y
})

// 记录是否刚刚结束拖拽，用于防止拖拽后立即触发点击关闭
const justFinishedDragging = ref(false)

// 记录卡片高度，用于在内容切换时保持位置
const savedCardHeight = ref<number | null>(null)

// 检测是否在标签页面（使用函数形式，延迟访问 route，避免初始化顺序问题）
function checkIsTagsPage(): boolean {
  try {
    if (typeof document === 'undefined') return false
    // 优先通过 DOM 判断，避免依赖 route
    if (document.querySelector('.tags__layout') !== null) {
      return true
    }
    // 其次通过 location 判断
    if (typeof window !== 'undefined' && window.location?.pathname?.startsWith('/tags')) {
      return true
    }
    // 最后尝试使用 route（如果可用）
    try {
      const routeInstance = useRoute()
      if (routeInstance?.path?.startsWith('/tags')) {
        return true
      }
    } catch {
      // route 可能还没初始化，忽略错误
    }
    return false
  } catch {
    return false
  }
}

// 使用 ref 而不是 computed，避免在初始化时访问 route
const isTagsPage = ref(false)
const isTagsPageStyle = computed(() => {
  return isTagsPage.value
})

// 移动端不启用拖拽功能，卡片固定位置

// 计算卡片样式
const cardStyle = computed(() => {
  // 检测是否为移动端
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                   (window.matchMedia && window.matchMedia('(max-width: 959px)').matches)
  
  return {
    transform: `translate(calc(-50% + ${position.value.x}px), ${position.value.y}px)`,
    // 移动端不显示拖拽光标
    cursor: isMobile ? 'default' : (isDragging.value ? 'grabbing' : 'grab')
  }
})

// 拖拽处理函数
function handleMouseDown(e: MouseEvent) {
  // 移动端不启用拖拽功能
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                   (window.matchMedia && window.matchMedia('(max-width: 959px)').matches)
  if (isMobile) {
    return
  }
  
  // 如果点击的是关闭按钮，不触发拖拽
  const target = e.target as HTMLElement
  if (target.closest('.article-preview-close-content')) {
    return
  }

  isDragging.value = true
  
  // 记录鼠标按下时的位置和弹窗当前位置
  dragStart.value = {
    mouseX: e.clientX,
    mouseY: e.clientY,
    positionX: position.value.x,
    positionY: position.value.y
  }

  // 添加全局事件监听
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  
  // 阻止默认行为和事件传播，避免选中文本和触发其他点击事件
  e.preventDefault()
  e.stopPropagation()
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return

  // 计算鼠标移动的增量
  const deltaX = e.clientX - dragStart.value.mouseX
  const deltaY = e.clientY - dragStart.value.mouseY
  
  // 计算新的位置：初始位置 + 移动增量
  let newX = dragStart.value.positionX + deltaX
  let newY = dragStart.value.positionY + deltaY

  // 获取卡片实际尺寸（如果卡片已渲染）
  const cardElement = document.querySelector('.article-preview-card') as HTMLElement
  if (cardElement) {
    const rect = cardElement.getBoundingClientRect()
    const cardWidth = rect.width
    const cardHeight = rect.height
    
    // 放宽边界限制：允许部分拖出视口，但至少保留一小部分可见
    const minVisibleWidth = 0 // 允许几乎完全拖出视口（最大化拖拽范围）
    const minVisibleHeight = 0 // 允许几乎完全拖出视口（最大化拖拽范围）
    
    // 计算边界：卡片中心可以移动的范围
    // 左边界：当卡片中心在 minVisibleWidth - cardWidth/2 时，卡片右边缘刚好在 minVisibleWidth
    // 右边界：当卡片中心在 window.innerWidth - minVisibleWidth - cardWidth/2 时，卡片左边缘刚好在 minVisibleWidth
    const maxX = window.innerWidth / 2 - minVisibleWidth - cardWidth / 2
    // 向下：y 最大时，卡片顶部应该在视口底部（y = window.innerHeight - cardHeight + minVisibleHeight）
    // 但实际上 position.y 是相对于 top: 0 的偏移，所以 maxY = window.innerHeight - cardHeight + minVisibleHeight
    // 向上：y 最小时，卡片顶部应该在视口顶部上方（y = -minVisibleHeight）
    const maxY = window.innerHeight - cardHeight + minVisibleHeight
    const minX = -(window.innerWidth / 2 - minVisibleWidth - cardWidth / 2)
    const minY = -minVisibleHeight

    position.value = {
      x: Math.max(minX, Math.min(newX, maxX)),
      y: Math.max(minY, Math.min(newY, maxY))
    }
  } else {
    // 如果卡片还未渲染，使用默认值
    const minVisibleWidth = 0 // 减小以允许更大的拖拽范围
    const minVisibleHeight = 0 // 减小以允许更大的拖拽范围
    const defaultCardWidth = 520
    const defaultCardHeight = 600 // 统一卡片高度
    
    const maxX = window.innerWidth / 2 - minVisibleWidth - defaultCardWidth / 2
    const minX = -(window.innerWidth / 2 - minVisibleWidth - defaultCardWidth / 2)
    // 向下：y 最大时，卡片顶部应该在视口底部（y = window.innerHeight - defaultCardHeight + minVisibleHeight）
    const maxY = window.innerHeight - defaultCardHeight + minVisibleHeight
    // 向上：y 最小时，卡片顶部应该在视口顶部上方（y = -minVisibleHeight）
    const minY = -minVisibleHeight
    
    position.value = {
      x: Math.max(minX, Math.min(newX, maxX)),
      y: Math.max(minY, Math.min(newY, maxY))
    }
  }
}

function handleMouseUp(e?: MouseEvent) {
  if (isDragging.value) {
    isDragging.value = false
    justFinishedDragging.value = true // 标记刚刚结束拖拽
    
    // 移除全局事件监听
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    
    // 阻止事件传播和默认行为，防止触发 overlay 的点击关闭
    if (e) {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
    }
    
    // 300ms 后重置标记，允许正常的点击关闭
    setTimeout(() => {
      justFinishedDragging.value = false
    }, 300)
  }
}

// 处理 overlay 的点击事件
function handleOverlayClick(e: MouseEvent) {
  // 如果刚刚结束拖拽，不关闭窗口
  if (justFinishedDragging.value) {
    return
  }
  close()
}

// 处理 overlay 的 mousedown 事件
function handleOverlayMouseDown(e: MouseEvent) {
  // 如果正在拖拽或刚刚结束拖拽，阻止事件
  if (isDragging.value || justFinishedDragging.value) {
    e.preventDefault()
    e.stopPropagation()
  }
}

// 调整窗口位置以适配窗口大小变化
function adjustPositionForResize() {
  if (!visible.value) return
  
  const cardElement = document.querySelector('.article-preview-card') as HTMLElement
  if (!cardElement) return
  
  const rect = cardElement.getBoundingClientRect()
  const cardWidth = rect.width
  const cardHeight = rect.height
  
  // 检测是否在标签页面（PC端）
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                   (window.matchMedia && window.matchMedia('(max-width: 959px)').matches)
  
  if (isTagsPage.value && !isMobile) {
    // 标签页PC端：重新计算右下角位置
    const padding = 20
    const targetX = window.innerWidth / 2 - padding - cardWidth / 2
    const targetY = window.innerHeight - padding - cardHeight
    
    // 确保不会超出边界
    const minVisibleWidth = 0
    const minVisibleHeight = 0
    const maxX = window.innerWidth / 2 - minVisibleWidth - cardWidth / 2
    const maxY = window.innerHeight - cardHeight + minVisibleHeight
    const minX = -(window.innerWidth / 2 - minVisibleWidth - cardWidth / 2)
    const minY = -minVisibleHeight
    
    position.value = {
      x: Math.max(minX, Math.min(targetX, maxX)),
      y: Math.max(minY, Math.min(targetY, maxY))
    }
  } else {
    // 其他情况：确保位置在边界内
    const minVisibleWidth = 0
    const minVisibleHeight = 0
    const maxX = window.innerWidth / 2 - minVisibleWidth - cardWidth / 2
    const maxY = window.innerHeight - cardHeight + minVisibleHeight
    const minX = -(window.innerWidth / 2 - minVisibleWidth - cardWidth / 2)
    const minY = -minVisibleHeight
    
    position.value = {
      x: Math.max(minX, Math.min(position.value.x, maxX)),
      y: Math.max(minY, Math.min(position.value.y, maxY))
    }
  }
}

// 窗口大小变化监听（使用防抖优化性能）
let resizeTimer: ReturnType<typeof setTimeout> | null = null
function handleResize() {
  if (resizeTimer) {
    clearTimeout(resizeTimer)
  }
  resizeTimer = setTimeout(() => {
    adjustPositionForResize()
  }, 100)
}

// 组件卸载时清理事件监听
onMounted(() => {
  // 更新标签页状态
  isTagsPage.value = checkIsTagsPage()
  
  window.addEventListener('resize', handleResize)
  
  // 监听路由变化以更新标签页状态（路由关闭逻辑由 Layout 组件处理）
  nextTick(() => {
    try {
      const routeInstance = useRoute()
      if (routeInstance) {
        // 监听路由变化，更新标签页状态
        watch(() => routeInstance?.path, () => {
          isTagsPage.value = checkIsTagsPage()
        })
      }
    } catch (error) {
      // 如果 useRoute 不可用，只使用 DOM 和 location 判断
      console.debug('Route watch not available, using DOM-based detection only')
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  if (resizeTimer) {
    clearTimeout(resizeTimer)
  }
})

// 初始化 mermaid 图表
async function initMermaid() {
  const container = contentRef.value
  if (!container) return

  // 查找所有 mermaid 代码块
  // markdown-it 渲染的格式：<pre><code class="language-mermaid">...</code></pre>
  // 或者可能已经被 Shiki 处理过，需要查找所有可能的格式
  let mermaidBlocks = container.querySelectorAll('code.language-mermaid, pre code.language-mermaid, code[class*="language-mermaid"]')
  
  // 如果找不到，尝试查找所有 code 元素，然后过滤
  if (mermaidBlocks.length === 0) {
    const allCodeBlocks = container.querySelectorAll('pre code, code[class*="language"]')
    const filtered = Array.from(allCodeBlocks).filter((block: Element) => {
      const className = block.className || ''
      return className.includes('mermaid') || className.includes('language-mermaid')
    })
    // 创建一个新的 NodeList
    const fragment = document.createDocumentFragment()
    filtered.forEach(el => fragment.appendChild(el.cloneNode(true)))
    mermaidBlocks = fragment.querySelectorAll('code') || new NodeList()
  }
  
  // 调试：输出容器内容和找到的代码块
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) {
    console.debug('Mermaid init debug:', {
      containerHTML: container.innerHTML.substring(0, 500),
      allPreCode: container.querySelectorAll('pre code').length,
      allCode: container.querySelectorAll('code').length,
      mermaidBlocksCount: mermaidBlocks.length,
      mermaidBlocks: Array.from(mermaidBlocks).map(b => ({
        className: b.className,
        textContent: b.textContent?.substring(0, 50)
      }))
    })
  }
  
  if (mermaidBlocks.length === 0) return

  try {
    // 动态导入 mermaid
    const mermaidModule = await import('mermaid')
    const mermaid = mermaidModule.default || mermaidModule
    
    // 初始化 mermaid（只需要初始化一次）
    // 检查是否已经初始化（通过检查配置或直接初始化）
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark.value ? 'dark' : 'default',
        securityLevel: 'loose'
      })
    } catch (e) {
      // 如果已经初始化，忽略错误
      console.debug('Mermaid already initialized or initialization failed:', e)
    }

    // 处理每个 mermaid 代码块
    for (const block of Array.from(mermaidBlocks)) {
      const code = block.textContent || ''
      if (!code.trim()) continue

      // 检查是否已经渲染过
      const pre = block.closest('pre')
      if (pre && pre.querySelector('.mermaid')) {
        continue
      }

      // 创建容器
      const mermaidContainer = document.createElement('div')
      mermaidContainer.className = 'mermaid'
      mermaidContainer.textContent = code
      
      // 替换代码块
      if (pre && pre.parentNode) {
        pre.parentNode.replaceChild(mermaidContainer, pre)
      }

      // 渲染 mermaid
      try {
        // 使用 mermaid.run() 方法（新版本 API）
        if (typeof mermaid.run === 'function') {
          await mermaid.run({
            nodes: [mermaidContainer],
            suppressErrors: true
          })
        } else {
          // 旧版本 API：使用 render
          const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          const { svg } = await mermaid.render(id, code)
          mermaidContainer.innerHTML = svg
        }
      } catch (error) {
        console.warn('Failed to render mermaid:', error)
        // 如果渲染失败，保留原始代码
        mermaidContainer.textContent = code
      }
    }
  } catch (error) {
    console.warn('Failed to load mermaid:', error)
  }
}

// 初始化代码高亮（使用 Shiki）
async function initCodeHighlight() {
  const container = contentRef.value
  if (!container) return

  // 查找所有代码块（排除已经高亮的和 mermaid）
  // 注意：选择器要匹配 markdown-it 渲染的格式：<pre><code class="language-xxx">
  // 排除 mermaid（可能已经被处理成 .mermaid div）
  const codeBlocks = container.querySelectorAll('pre code[class*="language-"]:not(.shiki):not([class*="mermaid"]):not(.language-mermaid)')
  if (codeBlocks.length === 0) return

  try {
    // 动态导入 Shiki
    const shiki = await import('shiki')
    const { getHighlighter } = shiki
    
    // 获取主题
    const theme = 'dracula-soft'
    
    // 获取所有需要的语言
    const languages = new Set<string>()
    codeBlocks.forEach(block => {
      const langMatch = block.className.match(/language-(\w+)/)
      if (langMatch) {
        const lang = langMatch[1]
        if (lang !== 'mermaid' && lang.trim()) {
          languages.add(lang)
        }
      }
    })
    
    if (languages.size === 0) return
    
    // 初始化高亮器（加载所有需要的语言）
    const highlighter = await getHighlighter({
      themes: [theme],
      langs: Array.from(languages) as any[]
    })
    
    // 处理每个代码块
    for (const codeBlock of Array.from(codeBlocks)) {
      const langMatch = codeBlock.className.match(/language-(\w+)/)
      if (!langMatch) continue
      
      const lang = langMatch[1]
      // 获取代码内容，确保获取完整内容
      let code = codeBlock.textContent || ''
      
      // 如果 textContent 为空，尝试从 innerHTML 获取
      if (!code.trim() && codeBlock.innerHTML) {
        // 移除可能的 HTML 标签，只保留文本
        const temp = document.createElement('div')
        temp.innerHTML = codeBlock.innerHTML
        code = temp.textContent || ''
      }
      
      // 跳过 mermaid 和空代码块
      if (lang === 'mermaid' || !code.trim()) continue
      
      try {
        const html = highlighter.codeToHtml(code, {
          lang,
          theme
        })
        
        // 替换代码块
        const pre = codeBlock.closest('pre')
        if (pre && pre.parentNode) {
          // 创建临时容器来解析 HTML
          const temp = document.createElement('div')
          temp.innerHTML = html
          const highlightedPre = temp.firstElementChild
          if (highlightedPre) {
            pre.parentNode.replaceChild(highlightedPre, pre)
          }
        }
      } catch (error) {
        console.warn(`Failed to highlight code block (${lang}):`, error)
        // 如果高亮失败，至少保留原始代码块
      }
    }
  } catch (error) {
    console.warn('Failed to load Shiki:', error)
  }
}

// 暴露方法供外部调用
async function show(anchorTitle: string, anchorContent: string) {
  // 记录弹窗之前是否已打开
  const wasVisible = visible.value
  
  // 如果窗口已经打开，保存当前卡片高度和位置
  if (wasVisible) {
    const cardElement = document.querySelector('.article-preview-card') as HTMLElement
    if (cardElement) {
      const rect = cardElement.getBoundingClientRect()
      savedCardHeight.value = rect.height
      // 位置已经保存在 position.value 中，不需要额外保存
    }
  }
  
  // 更新内容
  title.value = anchorTitle
  content.value = anchorContent
  
  // 只有在弹窗之前是关闭状态时才重置位置到初始状态
  // 如果弹窗已经打开，保持当前位置不变
  if (!wasVisible) {
    // 实时检测是否在标签页面（PC端），如果是，先移动到右下角再显示，避免闪烁
    const isCurrentlyTagsPage = checkIsTagsPage()
    
    if (isCurrentlyTagsPage) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                       (window.matchMedia && window.matchMedia('(max-width: 959px)').matches)
      
      if (!isMobile) {
        // PC端：先隐藏窗口，移动到右下角后再显示，避免闪烁
        visible.value = false
        await nextTick()
        
        // 计算右下角位置并直接设置（不使用动画，避免闪烁）
        const cardWidth = 520 // PC端卡片宽度
        const cardHeight = 600 // PC端标签页卡片高度
        const padding = 20 // 距离边缘的间距
        
        // 计算右下角位置
        // 由于 transform: translate(-50%, ...)，窗口中心在屏幕中心 + position.x
        // 要定位到右下角：窗口右边缘距离右边缘 padding，窗口底部距离底部 padding
        // 窗口中心 x = window.innerWidth - padding - cardWidth/2
        // position.x = (window.innerWidth - padding - cardWidth/2) - window.innerWidth/2 = window.innerWidth/2 - padding - cardWidth/2
        const targetX = window.innerWidth / 2 - padding - cardWidth / 2
        const targetY = window.innerHeight - padding - cardHeight
        
        // 直接设置位置到右下角
        position.value = { x: targetX, y: targetY }
        
        // 等待位置更新完成
        await nextTick()
        
        // 然后再显示窗口，避免从原始位置到右下角的闪烁
        savedCardHeight.value = null
        visible.value = false // 先隐藏，等处理完再显示
      } else {
        // 移动端：保持顶部定位
        position.value = { x: 0, y: 0 }
        savedCardHeight.value = null
        visible.value = false // 先隐藏，等处理完再显示
      }
    } else {
      // PC端：正文预览也统一使用右下角位置
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                       (window.matchMedia && window.matchMedia('(max-width: 959px)').matches)
      
      if (!isMobile) {
        // PC端：正文预览也定位在右下角
        visible.value = false
        await nextTick()
        
        // 计算右下角位置并直接设置
        const cardWidth = 520 // PC端卡片宽度
        const cardHeight = 600 // PC端统一卡片高度
        const padding = 20 // 距离边缘的间距
        
        const targetX = window.innerWidth / 2 - padding - cardWidth / 2
        const targetY = window.innerHeight - padding - cardHeight
        
        position.value = { x: targetX, y: targetY }
        await nextTick()
        savedCardHeight.value = null
        visible.value = false // 先隐藏，等处理完再显示
      } else {
        // 移动端：保持顶部定位
        position.value = { x: 0, y: 0 }
        savedCardHeight.value = null
        visible.value = false // 先隐藏，等处理完再显示
      }
    }
  } else {
    // 窗口已经打开，保持可见状态，只更新内容
    // 这样位置不会变化
    await nextTick()
  }
  
  // 等待 DOM 更新
  if (!wasVisible) {
    await nextTick()
    visible.value = true
  }
  
  await nextTick()
  
  // 如果保存了高度，应用最小高度以保持位置
  if (savedCardHeight.value) {
    const cardElement = document.querySelector('.article-preview-card') as HTMLElement
    if (cardElement) {
      cardElement.style.minHeight = `${savedCardHeight.value}px`
    }
  }
  
  // 先初始化 mermaid（在代码高亮之前，避免被 Shiki 处理）
  await initMermaid()
  await nextTick()
  
  // 然后初始化代码高亮（排除 mermaid 代码块）
  await initCodeHighlight()
  
  // 设置预览窗口内标题链接的点击处理
  await nextTick()
  setupTitleLinkClickHandler()
  
  // 等待内容渲染完成后，移除最小高度限制，让内容自然调整
  await nextTick()
  setTimeout(() => {
    const cardElement = document.querySelector('.article-preview-card') as HTMLElement
    if (cardElement && savedCardHeight.value) {
      cardElement.style.minHeight = ''
      savedCardHeight.value = null
    }
  }, 100)
}

// 处理预览窗口内容的点击事件
function handleContentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const link = target.closest('a')
  
  if (!link) return
  
  // 检查是否是标题链接（文章标题 h1.article-preview-title-link > a）
  const h1Link = link.closest('h1.article-preview-title-link')
  if (h1Link && link.closest('h1') === h1Link) {
    // 关闭预览窗口，然后允许正常跳转
    setTimeout(() => {
      close()
    }, 50)
    // 不阻止默认行为，让浏览器处理跳转
    return
  }
  
  // 检查是否是预览窗口内的锚点标题链接（h2-h6 内的链接）
  const heading = link.closest('h2, h3, h4, h5, h6')
  if (heading && contentRef.value?.contains(heading)) {
    const href = link.getAttribute('href') || ''
    // 如果是锚点链接，允许跳转并关闭预览窗口
    if (href.includes('#')) {
      setTimeout(() => {
        close()
      }, 50)
      // 不阻止默认行为，让浏览器处理跳转
      return
    }
  }
}

// 设置标题链接的点击处理（包括文章标题和章节标题）
function setupTitleLinkClickHandler() {
  if (!contentRef.value) return
  
  // 1. 文章标题链接（h1.article-preview-title-link > a）
  const articleTitleLinks = contentRef.value.querySelectorAll('h1.article-preview-title-link > a')
  articleTitleLinks.forEach((link) => {
    // 移除旧的事件监听器
    const existingHandler = (link as any).__titleLinkHandler
    if (existingHandler) {
      link.removeEventListener('click', existingHandler, true)
    }
    
    // 添加新的事件监听器（捕获阶段，确保优先执行）
    const handler = (e: Event) => {
      // 阻止其他监听器处理
      e.stopImmediatePropagation()
      // 关闭预览窗口
      setTimeout(() => {
        close()
      }, 50)
      // 允许正常跳转（不阻止默认行为）
    }
    
    link.addEventListener('click', handler, { capture: true })
    ;(link as any).__titleLinkHandler = handler
  })
  
  // 2. 章节标题链接（预览窗口内所有标题内的链接，例如 h2 > a.header-anchor）
  const headingLinks = contentRef.value.querySelectorAll('h2 a, h3 a, h4 a, h5 a, h6 a')
  headingLinks.forEach((link) => {
    const href = link.getAttribute('href') || ''
    // 只处理锚点链接（包含 # 的）或者指向当前页面的链接
    if (!href.includes('#') && !href.startsWith('/')) {
      return
    }
    
    // 移除旧的事件监听器
    const existingHandler = (link as any).__headingLinkHandler
    if (existingHandler) {
      link.removeEventListener('click', existingHandler, true)
    }
    
    // 添加新的事件监听器（捕获阶段，确保优先执行）
    const handler = (e: Event) => {
      // 阻止其他监听器处理（包括 useArticlePreview 中的监听器）
      e.stopImmediatePropagation()
      // 关闭预览窗口
      setTimeout(() => {
        close()
      }, 50)
      // 允许正常跳转（不阻止默认行为）
    }
    
    link.addEventListener('click', handler, { capture: true })
    ;(link as any).__headingLinkHandler = handler
  })
}

function close() {
  visible.value = false
  // 重置位置到初始状态
  position.value = { x: 0, y: 0 }
  // 确保拖拽状态被清除
  if (isDragging.value) {
    handleMouseUp()
  }
}

// 监听 ESC 键
function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && visible.value) {
    close()
  }
}

watch(visible, (newVal) => {
  if (newVal) {
    document.addEventListener('keydown', handleEscape)
  } else {
    document.removeEventListener('keydown', handleEscape)
  }
})

defineExpose({
  show,
  close,
  visible
})
</script>

<style scoped>
.article-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 99999; /* 提高 z-index 确保始终在顶部 */
  pointer-events: none;
  overflow: visible; /* 允许卡片拖拽到视口外 */
}

.article-preview-overlay > * {
  pointer-events: auto;
}

.article-preview-card {
  width: 520px;
  max-width: 90vw;
  max-height: 600px; /* 统一使用标签页预览的高度 */
  height: auto;
  background: var(--vp-c-bg);
  border-radius: 6px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-top: 0;
  border: 1px solid var(--vp-c-divider);
  user-select: none; /* 拖拽时避免选中文本 */
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE/Edge */
  /* 移动端禁用拖拽，touch-action 允许默认滚动 */
  position: absolute; /* 使用绝对定位，不受 flex 布局影响 */
  top: 0; /* 初始位置：页面最顶部 */
  left: 50%; /* 初始居中，配合 transform: translate(-50%, ...) 使用 */
}

/* 标签页面特殊样式：窗口高度更长（PC端） - 已统一，不再需要特殊样式 */

/* 移动端适配 */
@media (max-width: 959px) {
  .article-preview-card {
    width: calc(100vw - 2rem);
    max-width: calc(100vw - 2rem);
    max-height: 33vh; /* 移动端高度为视口的 1/3 */
    cursor: default !important; /* 移动端不显示拖拽光标 */
    touch-action: auto; /* 允许默认触摸行为，支持内容滚动 */
  }
  
  /* 标签页面移动端特殊样式：窗口高度更高 - 已统一，不再需要特殊样式 */
}

@media (max-width: 640px) {
  .article-preview-card {
    width: calc(100vw - 1.5rem);
    max-width: calc(100vw - 1.5rem);
    max-height: 33vh; /* 移动端高度为视口的 1/3 */
    cursor: default !important; /* 移动端不显示拖拽光标 */
    touch-action: auto; /* 允许默认触摸行为，支持内容滚动 */
  }
  
  /* 标签页面小屏幕移动端特殊样式：窗口高度更高 - 已统一，不再需要特殊样式 */
}

/* 桌面端拖拽光标 */
@media (min-width: 960px) {
  .article-preview-card:active {
    cursor: grabbing;
  }
}

/* Content 区域右上角的关闭按钮 */
.article-preview-close-content {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--vp-c-bg); /* 使用与卡片相同的背景色 */
  border: 1px solid var(--vp-c-divider);
  border-radius: 50%; /* 圆形按钮 */
  cursor: pointer;
  padding: 6px;
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  width: 32px;
  height: 32px;
  opacity: 0.9; /* 稍微透明，确保与背景融合 */
}

/* 移动端关闭按钮适配 */
@media (max-width: 640px) {
  .article-preview-close-content {
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    padding: 4px;
  }
}

.article-preview-close-content:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-divider);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.article-preview-content-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  touch-action: pan-y; /* 允许内容区域垂直滚动 */
  background: var(--vp-c-bg); /* 确保背景色与卡片一致 */
}

/* 拖拽时禁用内容区域的文本选择 */
.article-preview-card.dragging .article-preview-content {
  user-select: none;
  pointer-events: none;
}

.article-preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  color: var(--vp-c-text-1);
  font-family: 'TsangerJinKai02', "PingFang SC", Avenir, Tahoma, Arial, "Lantinghei SC", "Microsoft Yahei", "Hiragino Sans GB", "Microsoft Sans Serif", "WenQuanYi Micro Hei", Helvetica, sans-serif;
  font-size: 0.9375rem !important; /* 比正文小一号 (15px，正文是 17px) */
  line-height: 1.75 !important;
  letter-spacing: 0.015em; /* 与外部正文一致 */
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1; /* 与外部正文一致 */
  font-variant-ligatures: common-ligatures; /* 与外部正文一致 */
  -webkit-font-smoothing: antialiased; /* 与外部正文一致 */
  -moz-osx-font-smoothing: grayscale; /* 与外部正文一致 */
  text-rendering: optimizeLegibility; /* 与外部正文一致 */
  max-height: 520px; /* 统一使用标签页预览的内容区域高度（600px - 80px头部） */
  user-select: none; /* 禁用文本选择 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  touch-action: pan-y; /* 内容区域允许垂直滚动 */
  
  /* 内容区域内部的元素可以选择（如果需要的话） */
}

/* 确保内容区域内的文本不可选择 */
.article-preview-content * {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 移动端字体和 padding 优化 - 比正文小一号 */
@media (max-width: 959px) {
  .article-preview-content {
    font-size: 0.875rem !important; /* 比正文小一号 (14px，正文是 15.2px) */
    line-height: 1.65 !important;
    letter-spacing: 0.005em !important;
    padding: 16px;
    max-height: calc(33vh - 60px); /* 移动端高度为视口的 1/3 */
  }
  
  /* 移动端内容区域高度已统一，不再需要特殊样式 */
}

@media (max-width: 640px) {
  .article-preview-content {
    font-size: 0.8125rem !important; /* 比正文小一号 (13px，正文是 14.4px) */
    line-height: 1.6 !important;
    padding: 12px;
    max-height: calc(33vh - 50px); /* 移动端高度为视口的 1/3 */
  }
  
  /* 小屏幕移动端内容区域高度已统一，不再需要特殊样式 */
}

/* 确保使用 VitePress 的文档样式 */
.article-preview-content.vp-doc {
  /* 保留 padding，让内容有边距 */
  padding: 0 20px;
  /* 确保字体大小不被 .vp-doc 样式覆盖，比正文小一号 */
  font-size: 0.9375rem !important;
  line-height: 1.75 !important;
}

/* 提取的内容容器样式 */
.article-preview-content :deep(.article-preview-extracted-content) {
  padding: 0;
}

/* 确保标题有合适的上边距（除了第一个） */
.article-preview-content :deep(.article-preview-extracted-content > h2:not(:first-child)),
.article-preview-content :deep(.article-preview-extracted-content > h3:not(:first-child)),
.article-preview-content :deep(.article-preview-extracted-content > h4:not(:first-child)),
.article-preview-content :deep(.article-preview-extracted-content > h5:not(:first-child)),
.article-preview-content :deep(.article-preview-extracted-content > h6:not(:first-child)) {
  margin-top: 1.5rem;
}

.article-preview-content :deep(h1),
.article-preview-content :deep(h2),
.article-preview-content :deep(h3),
.article-preview-content :deep(h4),
.article-preview-content :deep(h5),
.article-preview-content :deep(h6) {
  font-family: 'TsangerJinKai02', "PingFang SC", Avenir, Tahoma, Arial, "Lantinghei SC", "Microsoft Yahei", "Hiragino Sans GB", "Microsoft Sans Serif", "WenQuanYi Micro Hei", Helvetica, sans-serif; /* 与外部正文一致 */
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.3;
  letter-spacing: -0.02em; /* 与外部正文一致 */
  -webkit-font-smoothing: antialiased; /* 与外部正文一致 */
  -moz-osx-font-smoothing: grayscale; /* 与外部正文一致 */
  position: relative; /* 为锚点链接提供定位上下文 */
}

/* 在预览窗口中隐藏锚点链接（# 符号） */
.article-preview-content :deep(.header-anchor),
.article-preview-content :deep(a.header-anchor) {
  display: none !important;
}

/* 移动端标题优化 - 与外部正文一致 */
@media (max-width: 959px) {
  .article-preview-content :deep(h1),
  .article-preview-content :deep(h2),
  .article-preview-content :deep(h3),
  .article-preview-content :deep(h4),
  .article-preview-content :deep(h5),
  .article-preview-content :deep(h6) {
    margin: 1.5rem 0 0.75rem;
    line-height: 1.35;
  }
  
  .article-preview-content :deep(h3) {
    font-size: clamp(0.875rem, 1.75vw, 1.125rem) !important; /* 比正文小一号 */
  }
  
  .article-preview-content :deep(h4) {
    font-size: clamp(0.8125rem, 1.25vw, 1rem) !important; /* 比正文小一号 */
  }
  
  .article-preview-content :deep(h5) {
    font-size: clamp(0.8125rem, 1.1vw, 0.9375rem) !important; /* 比正文小一号 */
  }
  
  .article-preview-content :deep(h6) {
    font-size: clamp(0.8125rem, 0.9vw, 0.875rem) !important; /* 比正文小一号 */
  }
}

@media (max-width: 640px) {
  .article-preview-content :deep(h1),
  .article-preview-content :deep(h2),
  .article-preview-content :deep(h3),
  .article-preview-content :deep(h4),
  .article-preview-content :deep(h5),
  .article-preview-content :deep(h6) {
    margin: 1.2rem 0 0.6rem;
    line-height: 1.4;
  }
  
  .article-preview-content :deep(h3) {
    font-size: clamp(0.8125rem, 1.75vw, 1rem) !important; /* 比正文小一号 */
  }
  
  .article-preview-content :deep(h4) {
    font-size: clamp(0.75rem, 1.25vw, 0.9375rem) !important; /* 比正文小一号 */
  }
  
  .article-preview-content :deep(h5) {
    font-size: clamp(0.75rem, 1.1vw, 0.875rem) !important; /* 比正文小一号 */
  }
  
  .article-preview-content :deep(h6) {
    font-size: clamp(0.75rem, 0.9vw, 0.8125rem) !important; /* 比正文小一号 */
  }
}

.article-preview-content :deep(h1:first-child),
.article-preview-content :deep(h2:first-child),
.article-preview-content :deep(h3:first-child) {
  margin-top: 0;
}

/* 文章预览标题链接样式 */
.article-preview-content :deep(h1.article-preview-title-link) {
  padding-left: 0;
  margin-top: 1.5rem !important; /* 确保文章标题有顶部间距 */
}

/* 如果标题链接是第一个元素，也需要有顶部间距 */
.article-preview-content :deep(h1.article-preview-title-link:first-child) {
  margin-top: 1.5rem !important;
}

.article-preview-content :deep(h1.article-preview-title-link > a) {
  text-decoration: none;
  color: inherit;
  display: inline; /* 改为 inline，让链接只占据内容宽度 */
  transition: color 0.2s;
  cursor: pointer;
}

.article-preview-content :deep(h1.article-preview-title-link > a:hover) {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}

.article-preview-content :deep(h1) {
  font-size: clamp(1.5rem, 2.5vw, 1.8rem) !important; /* 比正文小一号 */
  font-weight: 750;
  letter-spacing: -0.02em;
}

.article-preview-content :deep(h2) {
  font-size: clamp(1.25rem, 2vw, 1.5rem) !important; /* 比正文小一号 */
  font-weight: 700;
  letter-spacing: -0.02em;
}

.article-preview-content :deep(h3) {
  font-size: clamp(1rem, 1.75vw, 1.25rem) !important; /* 比正文小一号 */
  font-weight: 650;
  letter-spacing: -0.02em;
}

.article-preview-content :deep(h4) {
  font-size: clamp(0.9375rem, 1.25vw, 1.0625rem) !important; /* 比正文小一号 */
  font-weight: 650;
}

.article-preview-content :deep(h5) {
  font-size: clamp(0.9375rem, 1.1vw, 1rem) !important; /* 比正文小一号 */
  font-weight: 600;
}

.article-preview-content :deep(h6) {
  font-size: clamp(0.9375rem, 0.9vw, 0.95rem) !important; /* 比正文小一号 */
  font-weight: 600;
}

.article-preview-content :deep(p) {
  margin: 0 0 1.25rem !important;
  font-size: 0.9375rem !important; /* 比正文小一号 (15px，正文是 17px) */
  line-height: 1.75 !important;
  letter-spacing: 0.015em !important;
}

/* 预览内容第一个段落也需要顶部间距 */
.article-preview-content :deep(p:first-child) {
  margin-top: 1.5rem !important;
}

/* 如果第一个元素是标题链接，也需要顶部间距（已经设置了） */
/* 如果第一个元素是段落（比如加载提示），也需要顶部间距 */
.article-preview-content :deep(> p:first-child),
.article-preview-content :deep(> *:first-child) {
  margin-top: 1.5rem !important;
}

/* 移动端段落优化 - 比正文小一号 */
@media (max-width: 959px) {
  .article-preview-content :deep(p) {
    font-size: 0.875rem !important; /* 比正文小一号 (14px) */
    line-height: 1.65 !important;
    margin: 0 0 1rem;
  }
}

@media (max-width: 640px) {
  .article-preview-content :deep(p) {
    font-size: 0.8125rem !important; /* 比正文小一号 (13px) */
    line-height: 1.6 !important;
    margin: 0 0 0.875rem;
  }
}

.article-preview-content :deep(ul),
.article-preview-content :deep(ol) {
  margin: 0 0 1.25rem !important;
  padding-left: 1.5rem !important;
  font-size: 0.9375rem !important; /* 比正文小一号 (15px，正文是 17px) */
  line-height: 1.75 !important;
  letter-spacing: 0.015em !important;
}

/* 移动端列表优化 - 比正文小一号 */
@media (max-width: 959px) {
  .article-preview-content :deep(ul),
  .article-preview-content :deep(ol) {
    font-size: 0.875rem !important; /* 比正文小一号 (14px) */
    line-height: 1.65 !important;
    padding-left: 1.2rem !important;
    margin: 0 0 1rem !important;
  }
}

@media (max-width: 640px) {
  .article-preview-content :deep(ul),
  .article-preview-content :deep(ol) {
    font-size: 0.8125rem !important; /* 比正文小一号 (13px) */
    line-height: 1.6 !important;
    padding-left: 1.1rem !important;
    margin: 0 0 0.875rem !important;
  }
}

.article-preview-content :deep(li) {
  margin: 0.25rem 0;
}

/* 行内代码样式 - 比正文小一号 */
.article-preview-content :deep(:not(pre) > code),
.article-preview-content :deep(code:not(pre code)) {
  font-family: 'Anonymous Pro', 'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', 'Menlo', 'Consolas', 'DejaVu Sans Mono', monospace;
  font-size: 0.8125em !important; /* 比正文小一号 */
  font-weight: normal;
  font-style: normal;
  color: #333;
  background: #c8d0d8; /* 与外部正文一致 */
  padding: 0.2em 0.5em;
  margin: 0 0.2em;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.08);
  vertical-align: baseline;
  line-height: 1.5;
  letter-spacing: 0;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

.article-preview-content :deep(pre) {
  background: var(--vp-code-block-bg);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1rem 0;
}

.article-preview-content :deep(pre code) {
  background: transparent;
  padding: 0;
}

.article-preview-content :deep(blockquote) {
  border-left: 4px solid var(--vp-c-brand-1);
  padding-left: 1rem;
  margin: 1rem 0;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  padding: 0.75rem 1rem;
}

.article-preview-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.article-preview-content :deep(th),
.article-preview-content :deep(td) {
  border: 1px solid var(--vp-c-divider);
  padding: 0.5rem;
}

.article-preview-content :deep(th) {
  background: var(--vp-c-bg-soft);
  font-weight: 600;
}

.article-preview-content :deep(a) {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.article-preview-content :deep(a:hover) {
  text-decoration: underline;
}

/* Metadata 链接样式 - 与正文保持一致 */
.article-preview-content :deep(.meta-wrapper) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 2px;
  margin: 1rem 0;
}

.article-preview-content :deep(.meta-item) {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  max-width: 240px;
  color: var(--vp-c-text-1);
  cursor: default;
  font-size: 13px !important; /* 比正文小一号 */
  padding: 2px;
}

.article-preview-content :deep(.meta-icon),
.article-preview-content :deep(.meta-content) {
  display: inline-flex;
  align-items: center;
  margin-right: 0.375rem;
  vertical-align: middle;
}

.article-preview-content :deep(.meta-icon) {
  line-height: 1;
  overflow: visible;
  color: var(--vp-c-text-3);
}

.article-preview-content :deep(.meta-icon svg) {
  height: 18px;
  width: 18px;
  display: block;
  overflow: visible;
}

.article-preview-content :deep(.meta-content) {
  font-weight: 400;
  color: var(--vp-c-text-2);
  font-size: 0.8125rem !important; /* 比正文小一号 (13px) */
}

.article-preview-content :deep(time.meta-content) {
  display: inline-flex;
  align-items: center;
}

/* Metadata 中的链接样式 - 预览窗口中不可点击，显示为普通文本 */
.article-preview-content :deep(.meta-content a) {
  font-weight: 400;
  color: var(--vp-c-text-2);
  text-decoration: none;
  cursor: default;
  pointer-events: none; /* 禁用点击 */
}

.article-preview-content :deep(.meta-content a:hover) {
  color: var(--vp-c-text-2); /* hover 时保持原色，不变蓝 */
  text-decoration: none;
  cursor: default;
}

/* Mermaid 样式 */
.article-preview-content :deep(.mermaid) {
  margin: 1rem 0;
  text-align: center;
  overflow: visible;
}

.article-preview-content :deep(.mermaid svg) {
  max-width: 100%;
  height: auto;
}

/* 自定义滚动条 */
.article-preview-content::-webkit-scrollbar {
  width: 8px;
}

.article-preview-content::-webkit-scrollbar-track {
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
}

.article-preview-content::-webkit-scrollbar-thumb {
  background: var(--vp-c-divider);
  border-radius: 4px;
}

.article-preview-content::-webkit-scrollbar-thumb:hover {
  background: var(--vp-c-text-3);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .article-preview-card,
.fade-leave-active .article-preview-card {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.fade-enter-from .article-preview-card,
.fade-leave-to .article-preview-card {
  transform: scale(0.95);
  opacity: 0;
}
</style>

