<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="anchor-preview-overlay" @click.self="close">
        <div 
          class="anchor-preview-card" 
          :style="cardStyle"
          @click.stop
          @mousedown="handleMouseDown"
        >
          <div class="anchor-preview-content-wrapper">
            <button class="anchor-preview-close-content" @click="close" aria-label="关闭">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div class="anchor-preview-content vp-doc" ref="contentRef" v-html="content"></div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onUnmounted } from 'vue'
import { useData } from 'vitepress'

const { isDark } = useData()

const visible = ref(false)
const title = ref('')
const content = ref('')
const contentRef = ref<HTMLElement | null>(null)

// 拖拽相关状态
const position = ref({ x: 0, y: 0 }) // 初始位置（页面最顶部）
const isDragging = ref(false)
const dragStart = ref({ 
  mouseX: 0, // 鼠标按下时的 clientX
  mouseY: 0, // 鼠标按下时的 clientY
  positionX: 0, // 弹窗按下时的 position.x
  positionY: 0 // 弹窗按下时的 position.y
})

// 计算卡片样式
const cardStyle = computed(() => {
  return {
    transform: `translate(calc(-50% + ${position.value.x}px), ${position.value.y}px)`,
    cursor: isDragging.value ? 'grabbing' : 'grab'
  }
})

// 拖拽处理函数
function handleMouseDown(e: MouseEvent) {
  // 如果点击的是关闭按钮，不触发拖拽
  const target = e.target as HTMLElement
  if (target.closest('.anchor-preview-close-content')) {
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
  
  // 阻止默认行为，避免选中文本
  e.preventDefault()
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
  const cardElement = document.querySelector('.anchor-preview-card') as HTMLElement
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
    const defaultCardWidth = 600
    const defaultCardHeight = 450 // 默认卡片高度
    
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

function handleMouseUp() {
  if (isDragging.value) {
    isDragging.value = false
    // 移除全局事件监听
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
}

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
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
  title.value = anchorTitle
  content.value = anchorContent
  
  // 记录弹窗之前是否已打开
  const wasVisible = visible.value
  
  visible.value = false // 先隐藏，等处理完再显示
  
  // 只有在弹窗之前是关闭状态时才重置位置到初始状态
  // 如果弹窗已经打开，保持当前位置不变
  if (!wasVisible) {
    position.value = { x: 0, y: 0 }
  }
  
  // 等待 DOM 更新
  await nextTick()
  
  // 先设置内容，让 DOM 渲染
  visible.value = true
  await nextTick()
  
  // 先初始化 mermaid（在代码高亮之前，避免被 Shiki 处理）
  await initMermaid()
  await nextTick()
  
  // 然后初始化代码高亮（排除 mermaid 代码块）
  await initCodeHighlight()
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
  close
})
</script>

<style scoped>
.anchor-preview-overlay {
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

.anchor-preview-overlay > * {
  pointer-events: auto;
}

.anchor-preview-card {
  width: 600px;
  max-width: 90vw;
  max-height: 450px;
  height: auto;
  background: var(--vp-c-bg);
  border-radius: 4px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-top: 0;
  border: 1px solid var(--vp-c-divider);
  user-select: none; /* 拖拽时避免选中文本 */
  position: absolute; /* 使用绝对定位，不受 flex 布局影响 */
  top: 0; /* 初始位置：页面最顶部 */
  left: 50%; /* 初始居中，配合 transform: translate(-50%, ...) 使用 */
}

.anchor-preview-card:active {
  cursor: grabbing;
}

/* Content 区域右上角的关闭按钮 */
.anchor-preview-close-content {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
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
}

.anchor-preview-close-content:hover {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-divider);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.anchor-preview-content-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 拖拽时禁用内容区域的文本选择 */
.anchor-preview-card.dragging .anchor-preview-content {
  user-select: none;
  pointer-events: none;
}

.anchor-preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  color: var(--vp-c-text-1);
  font-family: 'TsangerJinKai02', "PingFang SC", Avenir, Tahoma, Arial, "Lantinghei SC", "Microsoft Yahei", "Hiragino Sans GB", "Microsoft Sans Serif", "WenQuanYi Micro Hei", Helvetica, sans-serif; /* 与外部正文一致 */
  font-size: 1.0625rem; /* 与外部正文一致 (17px) */
  line-height: 1.85; /* 与外部正文一致 */
  letter-spacing: 0.015em; /* 与外部正文一致 */
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1; /* 与外部正文一致 */
  font-variant-ligatures: common-ligatures; /* 与外部正文一致 */
  -webkit-font-smoothing: antialiased; /* 与外部正文一致 */
  -moz-osx-font-smoothing: grayscale; /* 与外部正文一致 */
  text-rendering: optimizeLegibility; /* 与外部正文一致 */
  max-height: 350px;
}

/* 移动端字体优化 - 与外部正文一致 */
@media (max-width: 959px) {
  .anchor-preview-content {
    font-size: 0.95rem;
    line-height: 1.75;
    letter-spacing: 0.005em;
  }
}

@media (max-width: 640px) {
  .anchor-preview-content {
    font-size: 0.9rem;
    line-height: 1.7;
  }
}

/* 确保使用 VitePress 的文档样式 */
.anchor-preview-content.vp-doc {
  /* 保留 padding，让内容有边距 */
  padding: 0 20px;
}

/* 提取的内容容器样式 */
.anchor-preview-content :deep(.anchor-preview-extracted-content) {
  padding: 0;
}

/* 确保标题有合适的上边距（除了第一个） */
.anchor-preview-content :deep(.anchor-preview-extracted-content > h2:not(:first-child)),
.anchor-preview-content :deep(.anchor-preview-extracted-content > h3:not(:first-child)),
.anchor-preview-content :deep(.anchor-preview-extracted-content > h4:not(:first-child)),
.anchor-preview-content :deep(.anchor-preview-extracted-content > h5:not(:first-child)),
.anchor-preview-content :deep(.anchor-preview-extracted-content > h6:not(:first-child)) {
  margin-top: 1.5rem;
}

.anchor-preview-content :deep(h1),
.anchor-preview-content :deep(h2),
.anchor-preview-content :deep(h3),
.anchor-preview-content :deep(h4),
.anchor-preview-content :deep(h5),
.anchor-preview-content :deep(h6) {
  font-family: 'TsangerJinKai02', "PingFang SC", Avenir, Tahoma, Arial, "Lantinghei SC", "Microsoft Yahei", "Hiragino Sans GB", "Microsoft Sans Serif", "WenQuanYi Micro Hei", Helvetica, sans-serif; /* 与外部正文一致 */
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.3;
  letter-spacing: -0.02em; /* 与外部正文一致 */
  -webkit-font-smoothing: antialiased; /* 与外部正文一致 */
  -moz-osx-font-smoothing: grayscale; /* 与外部正文一致 */
}

/* 移动端标题优化 - 与外部正文一致 */
@media (max-width: 959px) {
  .anchor-preview-content :deep(h1),
  .anchor-preview-content :deep(h2),
  .anchor-preview-content :deep(h3),
  .anchor-preview-content :deep(h4),
  .anchor-preview-content :deep(h5),
  .anchor-preview-content :deep(h6) {
    margin: 1.5rem 0 0.75rem;
    line-height: 1.35;
  }
  
  .anchor-preview-content :deep(h3) {
    font-size: clamp(1rem, 2vw, 1.4rem);
  }
  
  .anchor-preview-content :deep(h4) {
    font-size: clamp(0.95rem, 1.5vw, 1.2rem);
  }
  
  .anchor-preview-content :deep(h5) {
    font-size: clamp(0.95rem, 1.2vw, 1.1rem);
  }
  
  .anchor-preview-content :deep(h6) {
    font-size: clamp(0.95rem, 1vw, 1.05rem);
  }
}

@media (max-width: 640px) {
  .anchor-preview-content :deep(h1),
  .anchor-preview-content :deep(h2),
  .anchor-preview-content :deep(h3),
  .anchor-preview-content :deep(h4),
  .anchor-preview-content :deep(h5),
  .anchor-preview-content :deep(h6) {
    margin: 1.2rem 0 0.6rem;
    line-height: 1.4;
  }
  
  .anchor-preview-content :deep(h3) {
    font-size: clamp(0.95rem, 2vw, 1.3rem);
  }
  
  .anchor-preview-content :deep(h4) {
    font-size: clamp(0.9rem, 1.5vw, 1.15rem);
  }
  
  .anchor-preview-content :deep(h5) {
    font-size: clamp(0.9rem, 1.2vw, 1.05rem);
  }
  
  .anchor-preview-content :deep(h6) {
    font-size: clamp(0.9rem, 1vw, 1rem);
  }
}

.anchor-preview-content :deep(h1:first-child),
.anchor-preview-content :deep(h2:first-child),
.anchor-preview-content :deep(h3:first-child) {
  margin-top: 0;
}

.anchor-preview-content :deep(h1) {
  font-size: clamp(1.8rem, 3vw, 2.2rem); /* 与外部正文一致 */
  font-weight: 750;
  letter-spacing: -0.02em;
}

.anchor-preview-content :deep(h2) {
  font-size: clamp(1.5rem, 2.5vw, 1.85rem); /* 与外部正文一致 */
  font-weight: 700;
  letter-spacing: -0.02em;
}

.anchor-preview-content :deep(h3) {
  font-size: clamp(1.125rem, 2vw, 1.5rem); /* 与外部正文一致 */
  font-weight: 650;
  letter-spacing: -0.02em;
}

.anchor-preview-content :deep(h4) {
  font-size: clamp(1.0625rem, 1.5vw, 1.25rem); /* 与外部正文一致 */
  font-weight: 650;
}

.anchor-preview-content :deep(h5) {
  font-size: clamp(1.0625rem, 1.2vw, 1.15rem); /* 与外部正文一致 */
  font-weight: 600;
}

.anchor-preview-content :deep(h6) {
  font-size: clamp(1.0625rem, 1vw, 1.1rem); /* 与外部正文一致 */
  font-weight: 600;
}

.anchor-preview-content :deep(p) {
  margin: 0 0 1.25rem; /* 与外部正文一致 */
  font-size: 1.0625rem; /* 与外部正文一致 */
  line-height: 1.9; /* 与外部正文一致 */
  letter-spacing: 0.015em; /* 与外部正文一致 */
}

/* 移动端段落优化 - 与外部正文一致 */
@media (max-width: 959px) {
  .anchor-preview-content :deep(p) {
    font-size: 1rem;
    line-height: 1.8;
    margin: 0 0 1rem;
  }
}

@media (max-width: 640px) {
  .anchor-preview-content :deep(p) {
    font-size: 0.95rem;
    line-height: 1.75;
    margin: 0 0 0.875rem;
  }
}

.anchor-preview-content :deep(ul),
.anchor-preview-content :deep(ol) {
  margin: 0 0 1.25rem; /* 与外部正文一致 */
  padding-left: 1.5rem;
  font-size: 1.0625rem; /* 与外部正文一致 */
  line-height: 1.9; /* 与外部正文一致 */
  letter-spacing: 0.015em; /* 与外部正文一致 */
}

/* 移动端列表优化 - 与外部正文一致 */
@media (max-width: 959px) {
  .anchor-preview-content :deep(ul),
  .anchor-preview-content :deep(ol) {
    font-size: 1rem;
    line-height: 1.8;
    padding-left: 1.2rem;
    margin: 0 0 1rem;
  }
}

@media (max-width: 640px) {
  .anchor-preview-content :deep(ul),
  .anchor-preview-content :deep(ol) {
    font-size: 0.95rem;
    line-height: 1.75;
    padding-left: 1.1rem;
    margin: 0 0 0.875rem;
  }
}

.anchor-preview-content :deep(li) {
  margin: 0.25rem 0;
}

/* 行内代码样式 - 与外部正文完全一致 */
.anchor-preview-content :deep(:not(pre) > code),
.anchor-preview-content :deep(code:not(pre code)) {
  font-family: 'Anonymous Pro', 'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', 'Menlo', 'Consolas', 'DejaVu Sans Mono', monospace;
  font-size: 0.85em;
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

.anchor-preview-content :deep(pre) {
  background: var(--vp-code-block-bg);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1rem 0;
}

.anchor-preview-content :deep(pre code) {
  background: transparent;
  padding: 0;
}

.anchor-preview-content :deep(blockquote) {
  border-left: 4px solid var(--vp-c-brand-1);
  padding-left: 1rem;
  margin: 1rem 0;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  padding: 0.75rem 1rem;
}

.anchor-preview-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.anchor-preview-content :deep(th),
.anchor-preview-content :deep(td) {
  border: 1px solid var(--vp-c-divider);
  padding: 0.5rem;
}

.anchor-preview-content :deep(th) {
  background: var(--vp-c-bg-soft);
  font-weight: 600;
}

.anchor-preview-content :deep(a) {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.anchor-preview-content :deep(a:hover) {
  text-decoration: underline;
}

/* Mermaid 样式 */
.anchor-preview-content :deep(.mermaid) {
  margin: 1rem 0;
  text-align: center;
  overflow: visible;
}

.anchor-preview-content :deep(.mermaid svg) {
  max-width: 100%;
  height: auto;
}

/* 自定义滚动条 */
.anchor-preview-content::-webkit-scrollbar {
  width: 8px;
}

.anchor-preview-content::-webkit-scrollbar-track {
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
}

.anchor-preview-content::-webkit-scrollbar-thumb {
  background: var(--vp-c-divider);
  border-radius: 4px;
}

.anchor-preview-content::-webkit-scrollbar-thumb:hover {
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

.fade-enter-active .anchor-preview-card,
.fade-leave-active .anchor-preview-card {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.fade-enter-from .anchor-preview-card,
.fade-leave-to .anchor-preview-card {
  transform: scale(0.95);
  opacity: 0;
}
</style>

