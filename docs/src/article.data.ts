import fs from 'node:fs'
import { resolve, relative } from 'node:path'
import path from 'node:path'
import parseFrontmatter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import mathjax3 from 'markdown-it-mathjax3'
import footnote from 'markdown-it-footnote'

const excludedFiles = ['index.md', 'tags.md', 'archives.md']

// 创建 markdown-it 渲染器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})
md.use(mathjax3)
md.use(footnote)

// 提取文章摘要的函数 - 返回 Markdown 格式
function extractExcerptMarkdown(content: string, maxLength: number = 300): string {
  // 移除 frontmatter
  let text = content.replace(/^---[\s\S]*?---\n/, '')
  
  // 移除 frontmatter 后的空行
  text = text.replace(/^\n+/, '')
  
  // 按段落处理，跳过复杂内容块
  const lines = text.split('\n')
  const processedLines: string[] = []
  let inCodeBlock = false
  let inContainer = false
  let inMermaid = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // 检测 mermaid 代码块
    if (line.trim() === '```mermaid') {
      inMermaid = true
      inCodeBlock = true
      continue
    }
    
    // 检测代码块开始/结束
    if (line.trim().startsWith('```')) {
      if (inMermaid) {
        inMermaid = false
        inCodeBlock = false
      } else {
        inCodeBlock = !inCodeBlock
      }
      continue
    }
    
    // 检测容器块开始/结束
    if (line.trim().startsWith(':::')) {
      inContainer = !inContainer
      continue
    }
    
    // 跳过代码块和容器块内的内容
    if (inCodeBlock || inContainer) {
      continue
    }
    
    // 跳过复杂内容（但保留图片和标题）
    if (
      line.trim().startsWith('<') && line.trim().endsWith('>') || // HTML 标签
      line.trim().startsWith('|') || // 表格行
      line.trim().match(/^---+$/) // 分隔线
    ) {
      continue
    }
    
    // 如果这一行有内容，添加到摘要
    if (line.trim()) {
      processedLines.push(line)
      // 如果字符数超过限制或已经有 5 行或更多，停止
      const currentText = processedLines.join('\n\n')
      if (currentText.length > maxLength || processedLines.length >= 5) {
        break
      }
    }
  }
  
  const result = processedLines.join('\n\n').trim()
  return result || ''
}

export default {
  watch: [resolve(__dirname, './**/*.md')],
  load(watchedFiles: any[]) {
    const baseDir = resolve(__dirname)

    const articles = watchedFiles
      .filter((file: string) => {
        const filename = path.basename(file)
        return !excludedFiles.includes(filename)
      })
      .filter((articleFile: string) => {
        const articleContent = fs.readFileSync(articleFile, 'utf-8')
        const { data } = parseFrontmatter(articleContent)

        return !!data.publish
      })
      .map((articleFile: string) => {
        const articleContent = fs.readFileSync(articleFile, 'utf-8')
        const { data, content } = parseFrontmatter(articleContent)
        const relativePath = relative(baseDir, articleFile).replace(/\\/g, '/').replace(/\.md$/, '')
        const normalizedPath = `/${relativePath}`

        // 提取摘要，优先使用 frontmatter 中的 excerpt，否则自动提取
        const excerptMarkdown = data.excerpt || extractExcerptMarkdown(content, data.excerptLength || 300)
        // 使用 markdown-it 渲染摘要为 HTML
        const excerpt = excerptMarkdown ? md.render(excerptMarkdown) : ''

        return {
          ...data,
          path: normalizedPath,
          excerpt
        }
      })

    return articles
  },
}
