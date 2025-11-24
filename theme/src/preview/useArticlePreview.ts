import { onMounted, onUnmounted } from 'vue'

export function useArticlePreview(showPreview: (title: string, content: string) => void) {
  /**
   * 从其他页面加载内容
   * 使用隐藏的 iframe 加载页面，然后提取内容（因为 VitePress 是 SPA，需要等待渲染）
   */
  async function loadArticleContent(articlePath: string): Promise<{ title: string; content: string } | null> {
    return new Promise((resolve) => {
      try {
        // 规范化路径
        let fullPath = articlePath.startsWith('/') ? articlePath : `/${articlePath}`
        // 移除尾部斜杠
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
        }, 8000) // 8 秒超时
        
        iframe.onload = () => {
          if (loaded) return
          
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
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
  
  /**
   * 从文档中提取文章标题和内容
   */
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
    const docContent = document.querySelector('.vp-doc')
    if (!docContent || !docContent.contains(link)) {
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
    } else if (!href || href === 'javascript:void(0)') {
      // 如果 href 是 javascript:void(0) 但没有 originalHref，直接返回
      return
    }
    
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
    const isInternalLink = href.startsWith('/') || (!href.startsWith('http') && !href.startsWith('mailto:'))
    
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
      
      if (docContent) {
        let heading: Element | null = null
        
        if (headingId) {
          heading = docContent.querySelector(`#${headingId}`)
        } else if (anchor) {
          heading = Array.from(docContent.querySelectorAll('h2, h3, h4, h5, h6')).find((h) => {
            const id = h.getAttribute('id') || ''
            return id === anchor || id.includes(anchor) || anchor.includes(id)
          }) || null
        }

        if (heading) {
          const extracted = extractContentFromDOM(heading)
          if (extracted) {
            showPreview(extracted.title, extracted.html)
            return
          }
        }
      }

      // 如果找不到锚点内容，显示提示
      showPreview('未找到内容', '<p>无法在当前页面找到对应的章节内容。</p>')
      return
    }
    
    // 处理正文中的文章引用链接（不包含 # 的内部链接，且有 data-article-reference 标识）
    if (!hasAnchor && isArticleReference) {
      // 显示加载提示
      showPreview('加载中...', '<p>正在加载文章内容...</p>')
      
      // 加载文章内容
      const articleContent = await loadArticleContent(href)
      
      if (articleContent) {
        showPreview(articleContent.title, articleContent.content)
      } else {
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
      if (isArticleLink && !link.hasAttribute('data-original-href')) {
        // 检查链接是否在真正的正文内容区域（段落、列表、引用等）
        const isInContentArea = link.closest('p, li, td, th, blockquote, dd') !== null
        
        if (isInContentArea) {
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
  
  // 设置和移除监听器的辅助函数
  function setup() {
    // 立即移除旧的监听器，避免重复
    removeLinkListeners()
    
    // 立即设置监听器，不延迟
    setupLinkListeners()
    
    // 延迟 enrichLinks，确保 DOM 已渲染
    setTimeout(() => {
      // 给链接添加 data 属性和事件监听器
      enrichLinks()
      // 再次设置监听器，确保新添加的链接也被拦截
      setupLinkListeners()
    }, 100)
    
    // 使用 MutationObserver 监听 DOM 变化，确保新添加的链接也被拦截
    const observer = new MutationObserver(() => {
      // 重新 enrich 链接
      enrichLinks()
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
