/**
 * 锚点预览工具函数
 * 用于从 markdown 文件中提取指定锚点的内容
 */

interface AnchorContent {
  title: string
  content: string
}

/**
 * 生成 VitePress 风格的锚点 ID（与 VitePress 的锚点生成逻辑一致）
 */
function generateAnchorId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9\s-]/g, '') // 移除特殊字符，保留中文、英文、数字、空格、连字符
    .replace(/\s+/g, '-') // 空格替换为连字符
    .replace(/-+/g, '-') // 多个连字符合并为一个
    .replace(/^-|-$/g, '') // 移除首尾连字符
}

/**
 * 从 markdown 内容中提取指定锚点的内容
 * @param markdownContent markdown 文件内容
 * @param anchorId 锚点 ID（可能是原始文本或 URL 编码的 ID）
 * @returns 返回标题和内容，如果未找到则返回 null
 */
export function extractAnchorContent(
  markdownContent: string,
  anchorId: string
): AnchorContent | null {
  // 移除 frontmatter
  const processedContent = markdownContent.replace(/^---[\s\S]*?---\n/, '')
  
  // 解码 URL 编码的锚点 ID
  const decodedAnchorId = decodeURIComponent(anchorId)
  
  // 将 markdown 按行分割
  const lines = processedContent.split('\n')
  
  // 查找匹配的标题（支持 h2-h6）
  let startIndex = -1
  let endIndex = -1
  let title = ''
  let headingLevel = 0
  
  // 查找起始标题
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const headingMatch = line.match(/^(#{2,6})\s+(.+)$/)
    
    if (headingMatch) {
      const level = headingMatch[1].length
      const headingText = headingMatch[2].trim()
      
      // 生成标题的锚点 ID
      const headingAnchorId = generateAnchorId(headingText)
      
      // 检查是否是目标锚点（支持多种匹配方式）
      const isMatch =
        headingText === decodedAnchorId || // 完全匹配标题文本
        headingText === anchorId || // 匹配原始锚点 ID
        headingAnchorId === decodedAnchorId || // 匹配生成的锚点 ID
        headingAnchorId === anchorId || // 匹配原始锚点 ID（已格式化）
        headingText.includes(decodedAnchorId) || // 标题包含锚点文本
        decodedAnchorId.includes(headingText) // 锚点文本包含标题
      
      if (isMatch) {
        startIndex = i
        title = headingText
        headingLevel = level
        break
      }
    }
  }
  
  if (startIndex === -1) {
    return null
  }
  
  // 查找结束位置（下一个同级或更高级的标题）
  // 需要跟踪代码块、自定义块等状态，确保完整提取
  let inCodeBlock = false
  let codeBlockLang = ''
  let inContainer = false
  let containerType = ''
  let inDetails = false
  
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // 检测代码块（精确匹配 ``` 开头，可能包含语言标识）
    const codeBlockMatch = trimmed.match(/^```(\w*)\s*$/)
    if (codeBlockMatch) {
      if (inCodeBlock) {
        // 代码块结束
        inCodeBlock = false
        codeBlockLang = ''
      } else {
        // 代码块开始
        inCodeBlock = true
        codeBlockLang = codeBlockMatch[1] || ''
      }
      // 不 continue，继续处理这一行（包含在结果中）
    }
    
    // 检测自定义块（:::note, :::tip 等）
    if (trimmed.startsWith(':::')) {
      if (inContainer) {
        inContainer = false
        containerType = ''
      } else {
        inContainer = true
        containerType = trimmed.slice(3).trim().split(/\s+/)[0]
      }
      // 不 continue，继续处理这一行（包含在结果中）
    }
    
    // 检测 details 块
    if (trimmed.startsWith('<details')) {
      inDetails = true
      // 不 continue，继续处理这一行（包含在结果中）
    }
    if (trimmed.startsWith('</details')) {
      inDetails = false
      // 不 continue，继续处理这一行（包含在结果中）
    }
    
    // 只有在不在代码块、自定义块、details 块中时，才检查标题
    if (!inCodeBlock && !inContainer && !inDetails) {
      const headingMatch = line.match(/^(#{2,6})\s+/)
      
      if (headingMatch) {
        const level = headingMatch[1].length
        // 如果遇到同级或更高级的标题，则结束
        if (level <= headingLevel) {
          endIndex = i
          break
        }
      }
    }
  }
  
  // 如果没有找到结束位置，则取到文件末尾
  if (endIndex === -1) {
    endIndex = lines.length
  }
  
  // 提取内容
  const contentLines = lines.slice(startIndex, endIndex)
  let content = contentLines.join('\n')
  
  // 确保代码块完整（检查是否有未闭合的代码块）
  if (inCodeBlock) {
    // 如果代码块未闭合，添加闭合标记
    content += '\n```'
  }
  
  // 确保自定义块完整
  if (inContainer) {
    content += '\n:::'
  }
  
  // 确保 details 块完整
  if (inDetails) {
    content += '\n</details>'
  }
  
  // 调试：输出提取的内容（仅开发环境）
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) {
    console.debug('Extracted anchor content:', {
      title,
      anchorId,
      contentLength: content.length,
      firstLines: content.split('\n').slice(0, 10),
      hasUnclosedCodeBlock: inCodeBlock,
      hasUnclosedContainer: inContainer,
      hasUnclosedDetails: inDetails
    })
  }
  
  return {
    title,
    content
  }
}

/**
 * 从 URL 中解析路径和锚点
 * @param url 链接 URL（如 "/technology/common/docker/Docker基本介绍#输出层实现"）
 * @returns 返回路径和锚点 ID
 */
export function parseAnchorUrl(url: string): { path: string; anchor: string } | null {
  // 移除 base path 和查询参数
  const cleanUrl = url.split('?')[0].replace(/^\/+/, '')
  
  // 分离路径和锚点
  const [pathPart, anchor] = cleanUrl.split('#')
  
  if (!anchor) {
    return null
  }
  
  // 处理路径
  // VitePress 使用 cleanUrls，所以路径可能是：
  // - /technology/common/docker/Docker基本介绍 (无后缀)
  // - /technology/common/docker/Docker基本介绍.html (有 .html)
  let path = pathPart
  
  // 移除 .html 后缀（如果存在）
  path = path.replace(/\.html$/, '')
  
  // 如果路径为空，说明是当前页面的锚点，不需要处理
  if (!path) {
    return null
  }
  
  // 添加 .md 后缀（如果还没有）
  if (!path.endsWith('.md')) {
    path = path + '.md'
  }
  
  return {
    path,
    anchor: decodeURIComponent(anchor)
  }
}

/**
 * 获取 markdown 文件内容
 * @param filePath 文件路径（相对于 docs/src）
 * @returns markdown 内容
 */
export async function fetchMarkdownContent(filePath: string): Promise<string> {
  try {
    // 在开发环境中，可以直接 fetch
    // 在生产环境中，需要通过 API 或预加载的数据获取
    const response = await fetch(`/${filePath}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}`)
    }
    
    return await response.text()
  } catch (error) {
    console.error('Failed to fetch markdown content:', error)
    throw error
  }
}

