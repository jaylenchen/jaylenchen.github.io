import { onMounted, onUnmounted, inject } from 'vue'
import { delay, waitForCondition } from '@blog/theme/utils/async'

export function useArticlePreview(
  showPreview: (title: string, content: string) => void,
  loadArticleForPreviewFn?: ((path: string) => Promise<{ title: string; content: string } | null>) | null
) {
  // 优先使用传入的函数，如果没有则尝试注入（必须在 setup 上下文中）
  let loadArticleForPreview: ((path: string) => Promise<{ title: string; content: string } | null>) | null = null
  
  try {
    // 尝试注入，但如果不在 setup 上下文中会失败
    loadArticleForPreview = loadArticleForPreviewFn || inject<((path: string) => Promise<{ title: string; content: string } | null>) | null>('loadArticleForPreview', null)
  } catch (error) {
    // 如果 inject 失败，使用传入的函数或 null
    loadArticleForPreview = loadArticleForPreviewFn || null
  }
  
  async function handleLinkClick(e: Event) {
    const target = e.target as HTMLElement
    const link = target.closest('a')

    if (!link) return

    // 检查链接是否在预览窗口内
    const previewCard = link.closest('.article-preview-card')
    if (previewCard) {
      // 预览窗口内的标题链接（文章标题或章节标题）应该由 ArticlePreview 组件处理
      // 这里直接返回，不处理（让预览窗口内的事件处理器处理）
      return
    }
    
    // 检查是否在 .vp-doc 容器内（只处理文档内的链接）
    // 注意：需要检查链接的原始位置，因为预览窗口打开后，链接可能被移动
    const docContent = document.querySelector('.vp-doc')
    if (!docContent) return
    
    // 检查链接是否在 .vp-doc 容器内
    // 如果链接有 data-article-reference 或 data-heading-id，说明它是正文中的链接，应该处理
    const hasDataAttribute = link.hasAttribute('data-article-reference') || link.hasAttribute('data-heading-id')
    const isInDocContent = docContent.contains(link)
    
    if (!isInDocContent && !hasDataAttribute) {
      return
    }
    
    // 获取原始 href（如果被改为了 javascript:void(0)，从 data-original-href 获取）
    let href = link.getAttribute('href') || ''
    const originalHref = link.getAttribute('data-original-href')
    
    // 如果 href 是 javascript:void(0)，使用原始 href
    if (href === 'javascript:void(0)' && originalHref) {
      href = originalHref
      // 阻止默认行为（避免跳转）
      e.preventDefault()
      e.stopPropagation()
    } else if (href === 'javascript:void(0)') {
      // 如果 href 是 javascript:void(0) 但没有 originalHref，直接返回
      return
    }
    
    // 如果 href 为空，也直接返回
    if (!href) return

    // 检查是否是外部链接
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
      return
    }

    // 排除 href="#" 这种占位链接
    if (href === '#' || href === '#!') {
      return
    }
    
    // 检查是否是内部链接（包含 # 且 # 后面有内容的锚点链接，或者正文中的文章引用链接）
    const hasAnchor = href.includes('#') && href !== '#' && href !== '#!'
    const isArticleReference = link.hasAttribute('data-article-reference') // 检查是否是正文中的文章引用
    
    // 只有锚点链接或正文中的文章引用链接才处理
    if (!hasAnchor && !isArticleReference) {
      return
    }

    // 阻止默认跳转行为
    e.preventDefault()
    e.stopPropagation()
    
    // 处理锚点链接（当前页面的锚点）
    if (hasAnchor) {
      const headingId = link.getAttribute('data-heading-id')
    const anchor = headingId || decodeURIComponent(href.split('#')[1] || '')
    
      // 尝试在多个位置查找标题
      // 1. 首先在当前页面的 .vp-doc 中查找
      let heading: Element | null = null
      const docContent = document.querySelector('.vp-doc')
      
      if (docContent) {
      if (headingId) {
        heading = docContent.querySelector(`#${headingId}`)
      } else if (anchor) {
        heading = Array.from(docContent.querySelectorAll('h2, h3, h4, h5, h6')).find((h) => {
          const id = h.getAttribute('id') || ''
          return id === anchor || id.includes(anchor) || anchor.includes(id)
        }) || null
        }
      }
      
      // 2. 如果没找到，尝试在整个文档中查找（可能链接不在 .vp-doc 内，但标题在）
      if (!heading) {
        if (headingId) {
          heading = document.querySelector(`#${headingId}`)
        } else if (anchor) {
          heading = Array.from(document.querySelectorAll('h2, h3, h4, h5, h6')).find((h) => {
            const id = h.getAttribute('id') || ''
            return id === anchor || id.includes(anchor) || anchor.includes(id)
          }) || null
        }
      }

      if (heading) {
        const extracted = extractContentFromDOM(heading)
        if (extracted) {
          showPreview(extracted.title, extracted.html)
          return
        }
      }

      // 如果找不到锚点内容，显示提示
    showPreview('未找到内容', '<p>无法在当前页面找到对应的章节内容。</p>')
      return
    }
    
    // 处理正文中的文章引用链接（不包含 # 的内部链接，且有 data-article-reference 标识）
    // 对于文章链接，需要像标签页一样加载文章内容
    if (!hasAnchor && isArticleReference) {
      // 必须提供 loadArticleForPreview 函数才能加载文章
      if (!loadArticleForPreview) {
        return
      }
      
      // 显示加载提示
      showPreview('加载中...', '<p>正在加载文章内容...</p>')
      
      // 使用加载函数加载文章内容（与标签页使用相同的逻辑）
      try {
        const articleContent = await loadArticleForPreview(href)
        
        if (articleContent) {
          showPreview(articleContent.title, articleContent.content)
        } else {
          showPreview('加载失败', '<p>无法加载文章内容，请检查链接是否正确。</p>')
        }
      } catch (error) {
        showPreview('加载失败', '<p>无法加载文章内容，请检查链接是否正确。</p>')
      }
      return
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
    container.className = 'article-preview-extracted-content'
    
    // 克隆标题元素
    const clonedHeading = heading.cloneNode(true) as HTMLElement
    container.appendChild(clonedHeading)

    // 提取内容直到下一个同级或更高级的标题
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
   * 给链接添加 data 属性，并将锚点链接的 href 改为 javascript:void(0)
   */
  function enrichLinks() {
    const docContent = document.querySelector('.vp-doc')
    if (!docContent) return

    // 查找所有链接
    const allLinks = docContent.querySelectorAll('a[href]')
    
    // 查找所有标题元素，为锚点链接添加 data 属性
    const headings = docContent.querySelectorAll('h2, h3, h4, h5, h6')
    
    // 先为锚点链接添加 data 属性并修改 href
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName[1])
      const titleText = heading.textContent?.trim() || ''
      const headingId = heading.getAttribute('id') || ''
      
      if (!headingId) return
      
      // 查找指向这个标题的所有锚点链接
      allLinks.forEach((link) => {
        const href = link.getAttribute('href') || ''
        
        // 跳过外部链接和预览窗口内的链接
        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
          return
        }
        
        // 检查链接是否在预览窗口内
        const previewCard = link.closest('.article-preview-card')
        if (previewCard) {
          return // 预览窗口内的链接不处理
        }
        
        // 检查链接是否指向当前标题（支持多种格式）
        const matchesHeading = href === `#${headingId}` || 
            href.endsWith(`#${headingId}`) ||
            href.includes(`#${headingId}-`) ||
            (href.startsWith('#') && href.slice(1).startsWith(headingId))
        
        if (matchesHeading) {
          // 添加 data 属性
          link.setAttribute('data-heading-level', `h${level}`)
          link.setAttribute('data-heading-id', headingId)
          link.setAttribute('data-heading-text', titleText)
          
          // 保存原始 href 并改为 javascript:void(0)
          if (!link.hasAttribute('data-original-href')) {
            link.setAttribute('data-original-href', href)
            link.setAttribute('href', 'javascript:void(0)')
          }
        }
      })
    })
    
    // 处理正文中的其他锚点链接和文章引用链接
    allLinks.forEach((link) => {
      const href = link.getAttribute('href') || ''
      
      // 跳过外部链接和预览窗口内的链接
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
        return
      }
      
      // 检查链接是否在预览窗口内
      const previewCard = link.closest('.article-preview-card')
      if (previewCard) {
        return // 预览窗口内的链接不处理
      }
      
      // 确保链接在 .vp-doc 容器内（只处理正文中的链接）
      if (!docContent.contains(link)) {
        return // 不在正文中的链接不处理（比如导航栏、侧边栏等）
      }
      
      // 排除特定区域的链接（首页卡片、导航等）
      const excludedContainers = [
        '.archives__article-item',        // 首页文章卡片容器
        '.archives__article-title-link',  // 文章标题链接
        '.archives__article-read-more',   // "阅读全文"链接
        '.VPSidebar',                     // 侧边栏
        '.VPNav',                         // 导航栏
        '.VPLocalNav'                     // 本地导航
      ]
      
      // 检查链接是否在排除容器内
      for (const selector of excludedContainers) {
        if (link.closest(selector) !== null || link.classList.contains(selector.replace('.', ''))) {
          return // 排除这些区域的链接
        }
      }
      
      // 特殊处理：标签页的文章链接（.tags__article-link）
      // 这些链接应该被处理，即使它们不在 p, li 等容器中
      const isTagsArticleLink = link.classList.contains('tags__article-link') || 
                                link.closest('.tags__article-item') !== null
      
      // 排除 href="#" 这种占位链接（通常用于 JavaScript 事件，不是真正的锚点）
      if (href === '#' || href === '#!') {
        return
      }
      
      // 检查是否是锚点链接（包含 # 且 # 后面有内容的才是真正的锚点）
      const hasAnchor = href.includes('#') && href !== '#' && href !== '#!'
      // 检查是否是文章链接（不包含 # 的内部链接）
      const isArticleLink = !hasAnchor && (href.startsWith('/') || (!href.startsWith('http') && !href.startsWith('mailto:')))
      
      // 如果是锚点链接，保存原始 href 并改为 javascript:void(0)
      if (hasAnchor && !link.hasAttribute('data-original-href')) {
        link.setAttribute('data-original-href', href)
        link.setAttribute('href', 'javascript:void(0)')
      }
      
      // 如果是文章链接（正文中的文章引用），添加特殊标识并改为 javascript:void(0)
      // 只处理在段落、列表等真正正文内容中的链接，而不是在标题、卡片等结构性元素中
      // 但标签页的文章链接需要特殊处理
      if (isArticleLink && !link.hasAttribute('data-original-href')) {
        // 检查链接是否在真正的正文内容区域（段落、列表、引用等）
        const isInContentArea = link.closest('p, li, td, th, blockquote, dd') !== null
        
        // 标签页的文章链接也需要处理
        if (isInContentArea || isTagsArticleLink) {
          // 添加标识，表明这是正文中的文章引用链接
          link.setAttribute('data-article-reference', 'true')
          link.setAttribute('data-original-href', href)
          link.setAttribute('href', 'javascript:void(0)')
        }
      }
    })
  }

  function setupLinkListeners() {
    // 在 window 级别添加事件监听器
    window.addEventListener('click', handleLinkClick, { capture: true })
    
    // 同时也保留容器级别的事件监听
    const docContent = document.querySelector('.vp-doc')
    if (docContent) {
      docContent.addEventListener('click', handleLinkClick, { capture: true })
    }
  }
  
  function removeLinkListeners() {
    // 移除 window 级别的事件监听器
    window.removeEventListener('click', handleLinkClick, { capture: true } as any)
    
    // 移除容器级别的事件监听
    const docContent = document.querySelector('.vp-doc')
    if (docContent) {
      docContent.removeEventListener('click', handleLinkClick, { capture: true } as any)
      
      // 恢复所有锚点链接的原始 href
      const allLinks = docContent.querySelectorAll('a[data-original-href]')
      allLinks.forEach((link) => {
        const originalHref = link.getAttribute('data-original-href')
        if (originalHref) {
          link.setAttribute('href', originalHref)
          link.removeAttribute('data-original-href')
        }
      })
    }
  }
  
  // 防抖用的取消标记
  let enrichCancelToken: { cancelled: boolean } | null = null
  
  // 防抖执行 enrichLinks（使用协程等待机制）
  async function debouncedEnrichLinks() {
    // 取消之前的执行
    if (enrichCancelToken) {
      enrichCancelToken.cancelled = true
    }
    
    // 创建新的取消标记
    const cancelToken = { cancelled: false }
    enrichCancelToken = cancelToken
    
    // 使用协程等待机制：等待延迟信号
    // 这样可以确保异步操作按顺序执行
    try {
      await delay(50)
      
      // 检查是否被取消
      if (!cancelToken.cancelled) {
        enrichLinks()
        enrichCancelToken = null
      }
    } catch (error) {
      enrichCancelToken = null
      throw error
    }
  }
  
  // 设置和移除监听器的辅助函数（使用协程等待机制）
  async function setup() {
    // 立即移除旧的监听器，避免重复
    removeLinkListeners()
    
    // 立即设置监听器，不延迟
    setupLinkListeners()
    
    // 使用协程等待机制：等待 DOM 渲染完成
    // 首先等待一个初始延迟
    await delay(100)
    
    // 等待 .vp-doc 容器存在
    await waitForCondition(
      () => document.querySelector('.vp-doc') !== null,
      10, // 每 10ms 检查一次
      5000 // 最多等待 5 秒
    )
    
    // 给链接添加 data 属性和事件监听器
    enrichLinks()
    
    // 再次设置监听器，确保新添加的链接也被拦截
      setupLinkListeners()
    
    // 使用 MutationObserver 监听 DOM 变化，确保新添加的链接也被拦截
    // 使用协程等待机制实现防抖
    const observer = new MutationObserver(() => {
      // 防抖：使用 debouncedEnrichLinks（内部使用协程等待）
      debouncedEnrichLinks()
    })
    
    const docContent = document.querySelector('.vp-doc')
    if (docContent) {
      observer.observe(docContent, {
        childList: true,
        subtree: true
      })
    }
    
    // 保存 observer，以便后续清理
    ;(window as any).__articlePreviewObserver = observer
  }

  onMounted(() => {
    setup()
    // 监听路由变化，重新设置监听器
    window.addEventListener('popstate', setup)
    window.addEventListener('hashchange', setup)
  })

  onUnmounted(() => {
    removeLinkListeners()
    window.removeEventListener('popstate', setup)
    window.removeEventListener('hashchange', setup)
  })
}
