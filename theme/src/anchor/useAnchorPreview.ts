import { onMounted, onUnmounted } from 'vue'
import { parseAnchorUrl, extractAnchorContent } from './utils'
import { createMarkdownRenderer } from '../markdown/loaders/renderer-factory'

// 存储已加载的 markdown 内容缓存
const markdownCache = new Map<string, string>()

// 存储 markdown 索引（从 JSON 文件加载）
let markdownIndex: Record<string, string> | null = null

/**
 * 加载 markdown 索引
 */
async function loadMarkdownIndex(): Promise<Record<string, string>> {
  if (markdownIndex) {
    return markdownIndex
  }

  try {
    // 尝试从构建时生成的索引文件加载（在 public 目录中）
    const response = await fetch('/.vitepress/markdown-index.json')
    if (response.ok) {
      markdownIndex = await response.json()
      return markdownIndex!
    }
  } catch (error) {
    // 开发环境可能没有索引文件，这是正常的
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) {
      console.debug('Markdown index not found in dev mode, using direct fetch')
    } else {
      console.warn('Failed to load markdown index:', error)
    }
  }

  // 如果索引加载失败，返回空对象，将使用直接 fetch
  return {}
}

/**
 * 获取 markdown 文件内容
 * 优先从索引获取，否则从缓存或直接 fetch
 */
async function getMarkdownContent(filePath: string): Promise<string> {
  // 检查缓存
  if (markdownCache.has(filePath)) {
    return markdownCache.get(filePath)!
  }

  // 加载索引
  const index = await loadMarkdownIndex()

  // 从索引中查找（移除 .md 后缀）
  const key = filePath.replace(/\.md$/, '')
  if (index[key]) {
    const content = index[key]
    markdownCache.set(filePath, content)
    return content
  }

  // 如果索引中没有，尝试直接 fetch（开发环境）
  try {
    let response = await fetch(`/src/${filePath}`)

    if (!response.ok) {
      response = await fetch(`/${filePath}`)
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}: ${response.status}`)
    }

    const content = await response.text()
    markdownCache.set(filePath, content)
    return content
  } catch (error) {
    console.error('Failed to fetch markdown:', error)
    throw error
  }
}

export function useAnchorPreview(showPreview: (title: string, content: string) => void) {
  async function handleLinkClick(e: Event) {
    const target = e.target as HTMLElement
    const link = target.closest('a')

    if (!link) return

    const href = link.getAttribute('href')
    if (!href) return

    // 检查是否是外部链接
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return
    }

    // 只处理包含 # 的链接（锚点链接）
    if (!href.includes('#')) {
      return
    }
    
    // 检查是否在 .vp-doc 容器内（只处理文档内的锚点链接）
    const docContent = document.querySelector('.vp-doc')
    if (!docContent || !docContent.contains(link)) {
      return
    }

    // 立即拦截所有锚点链接，阻止默认跳转行为
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation() // 阻止同一元素上的其他事件监听器

    // 优先使用 data 属性获取信息（如果链接已经被 enrich 过）
    const headingId = link.getAttribute('data-heading-id')
    const headingLevel = link.getAttribute('data-heading-level')
    const headingText = link.getAttribute('data-heading-text')

    // 解析 URL
    const parsed = parseAnchorUrl(href)
    
    // 如果是当前页面的锚点（只有 #，没有路径），或者有 data 属性，直接从 DOM 提取
    if (href.startsWith('#') || headingId) {
      const anchor = headingId || decodeURIComponent(href.slice(1))
      const docContent = document.querySelector('.vp-doc')
      
      if (docContent) {
        // 使用 data-heading-id 或通过 id 查找标题
        let heading: Element | null = null
        
        if (headingId) {
          // 优先使用 data-heading-id
          heading = docContent.querySelector(`#${headingId}`)
        } else {
          // 回退：通过 id 查找
          heading = Array.from(docContent.querySelectorAll('h2, h3, h4, h5, h6')).find((h) => {
            const id = h.getAttribute('id') || ''
            return id === anchor || id.includes(anchor) || anchor.includes(id)
          }) || null
        }

        if (heading) {
          // 从 DOM 中提取内容（直接克隆，保留所有样式和渲染）
          const extracted = extractContentFromDOM(heading)
          if (extracted) {
            showPreview(extracted.title, extracted.html)
            return
          }
        }
      }

      // 如果找不到内容，显示提示
      showPreview('未找到内容', '<p>无法在当前页面找到对应的章节内容。</p>')
      return
    }

    // 如果是跨页面的锚点链接，回退到原来的 markdown 提取方式
    if (parsed) {
      try {
        const content = await getMarkdownContent(parsed.path)
        const anchorContent = extractAnchorContent(content, parsed.anchor)

        if (!anchorContent) {
          showPreview('未找到内容', '<p>无法找到对应的章节内容，请检查链接是否正确。</p>')
          return
        }

        // 渲染 markdown 为 HTML
        const renderer = await createMarkdownRenderer(parsed.path)
        const html = renderer.render(anchorContent.content)
        showPreview(anchorContent.title, html)
      } catch (error) {
        console.error('Failed to load anchor content:', error)
        showPreview('加载失败', '<p>无法加载内容，请稍后重试。</p>')
      }
    }
  }

  /**
   * 从 DOM 中提取标题及其内容（直接克隆 DOM 节点，保留所有样式和渲染）
   * @param heading 标题元素
   * @returns 包含标题和内容的 HTML 字符串
   */
  function extractContentFromDOM(heading: Element): { title: string; html: string } | null {
    const level = parseInt(heading.tagName[1])
    const titleText = heading.textContent?.trim() || ''
    
    if (!titleText) return null

    // 创建一个容器来存放提取的内容
    const container = document.createElement('div')
    container.className = 'anchor-preview-extracted-content'
    
    // 克隆标题元素
    const clonedHeading = heading.cloneNode(true) as HTMLElement
    container.appendChild(clonedHeading)

    // 提取内容直到下一个同级或更高级的标题
    // 找到第一个级别 <= 当前标题级别的标题（即同级或更高级）
    let current = heading.nextElementSibling
    while (current) {
      // 检查是否是标题元素
      if (current.tagName.match(/^H[2-6]$/)) {
        const currentLevel = parseInt(current.tagName[1])
        // 如果遇到同级或更高级的标题，停止提取
        if (currentLevel <= level) {
          break
        }
      }

      // 克隆当前元素及其所有子元素（保留所有样式、代码高亮、mermaid 等）
      const clonedElement = current.cloneNode(true) as HTMLElement
      container.appendChild(clonedElement)

      current = current.nextElementSibling
    }

    return {
      title: titleText,
      html: container.innerHTML
    }
  }

  /**
   * 给锚点链接添加 data 属性，方便后续查找，并直接在每个链接上添加事件监听器
   */
  function enrichAnchorLinks() {
    const docContent = document.querySelector('.vp-doc')
    if (!docContent) return

    // 查找所有包含 # 的链接
    const allLinks = docContent.querySelectorAll('a[href*="#"]')
    
    // 为每个锚点链接添加事件监听器
    allLinks.forEach((link) => {
      const href = link.getAttribute('href') || ''
      
      // 检查是否是外部链接
      if (href.startsWith('http://') || href.startsWith('https://')) {
        return
      }
      
      // 只处理包含 # 的链接（锚点链接）
      if (!href.includes('#')) {
        return
      }
      
      // 移除旧的事件监听器（如果存在）
      const existingHandler = (link as any).__anchorPreviewHandler
      if (existingHandler) {
        link.removeEventListener('click', existingHandler, true)
      }
      
      // 创建新的事件处理函数
      const handler = (e: Event) => {
        // 立即阻止默认行为和事件传播
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        
        // 调用主处理函数
        handleLinkClick(e)
      }
      
      // 在捕获阶段添加事件监听器
      link.addEventListener('click', handler, { capture: true, once: false })
      
      // 保存引用以便后续移除
      ;(link as any).__anchorPreviewHandler = handler
    })

    // 查找所有标题元素，添加 data 属性
    const headings = docContent.querySelectorAll('h2, h3, h4, h5, h6')
    
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName[1])
      const titleText = heading.textContent?.trim() || ''
      const headingId = heading.getAttribute('id') || ''
      
      if (!headingId) return
      
      // 查找指向这个标题的所有锚点链接
      // 匹配格式：href="#heading-id" 或 href="/path#heading-id" 或 href="#heading-id-xxx"
      allLinks.forEach((link) => {
        const href = link.getAttribute('href') || ''
        // 检查链接是否指向当前标题（支持多种格式）
        if (href === `#${headingId}` || 
            href.endsWith(`#${headingId}`) ||
            href.includes(`#${headingId}-`) ||
            (href.startsWith('#') && href.slice(1).startsWith(headingId))) {
          // 添加 data 属性
          link.setAttribute('data-heading-level', `h${level}`)
          link.setAttribute('data-heading-id', headingId)
          link.setAttribute('data-heading-text', titleText)
        }
      })
    })
  }

  function setupLinkListeners() {
    // 在 window 级别添加捕获阶段的事件监听器，确保在所有其他监听器之前执行
    window.addEventListener('click', handleLinkClick, { capture: true })
    
    // 同时也保留容器级别的事件监听作为双重保险
    const docContent = document.querySelector('.vp-doc')
    if (docContent) {
      // 使用捕获阶段来确保最先拦截事件，阻止默认跳转行为
      docContent.addEventListener('click', handleLinkClick, { capture: true })
    }
  }
  
  function removeLinkListeners() {
    // 移除 window 级别的事件监听器
    window.removeEventListener('click', handleLinkClick, { capture: true })
    
    // 移除所有链接上的事件监听器
    const docContent = document.querySelector('.vp-doc')
    if (docContent) {
      // 移除容器级别的事件监听
      docContent.removeEventListener('click', handleLinkClick, { capture: true })
      
      // 移除所有链接上的事件监听器
      const allLinks = docContent.querySelectorAll('a[href*="#"]')
      allLinks.forEach((link) => {
        const handler = (link as any).__anchorPreviewHandler
        if (handler) {
          link.removeEventListener('click', handler, true)
          delete (link as any).__anchorPreviewHandler
        }
      })
    }
  }
  
  // 设置和移除监听器的辅助函数
  function setup() {
    // 延迟设置监听器，确保 DOM 已渲染
    setTimeout(() => {
      removeLinkListeners() // 先移除旧的，避免重复
      setupLinkListeners()
      // 给锚点链接添加 data 属性
      enrichAnchorLinks()
    }, 100)
  }

  onMounted(() => {
    setup()
    // 监听路由变化，重新设置监听器
    // 使用 popstate 事件监听路由变化
    window.addEventListener('popstate', setup)
    // 使用 hashchange 事件监听 hash 变化
    window.addEventListener('hashchange', setup)
  })

  onUnmounted(() => {
    removeLinkListeners()
    window.removeEventListener('popstate', setup)
    window.removeEventListener('hashchange', setup)
  })
}

