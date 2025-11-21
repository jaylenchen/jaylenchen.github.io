import fs from 'node:fs'
import { resolve, relative } from 'node:path'
import path from 'node:path'
import parseFrontmatter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import mathjax3 from 'markdown-it-mathjax3'
import footnote from 'markdown-it-footnote'
// @ts-ignore
import markdownItInclude from 'markdown-it-include'
import { installHeadingAutoNumber } from '../.vitepress/markdown/heading-number'

const excludedFiles = ['index.md', 'tags.md', 'archives.md', 'about.md']

// 创建 markdown-it 渲染器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})
md.use(mathjax3)
md.use(footnote)

// 启用 markdown 文件引入功能
md.use(markdownItInclude, {
  root: resolve(__dirname, '../')
})

// 转换图片路径：将 ../assets/... 转换为 /...
const defaultImageRender = md.renderer.rules.image || ((tokens: any[], idx: number, options: any, env: any, self: any) => {
  return self.renderToken(tokens, idx, options);
});

md.renderer.rules.image = (tokens: any[], idx: number, options: any, env: any, self: any) => {
  const token = tokens[idx];
  const src = token.attrGet('src');
  
  if (src) {
    // 匹配任意数量的 ../ 或 ./ 后跟 assets/ 的路径
    const assetsMatch = src.match(/(?:\.\.\/|\.\/)*assets\/(.+)$/);
    if (assetsMatch) {
      // 转换为绝对路径：/path/to/file
      const newPath = `/${assetsMatch[1]}`;
      token.attrSet('src', newPath);
    }
  }
  
  return defaultImageRender(tokens, idx, options, env, self);
};

// 为摘要渲染也添加标题编号（与站点渲染一致）：h1 不编号；h2 中文数字+顿号；h3+ 阿拉伯分级
installHeadingAutoNumber(md as any)

// 处理 include 语句：读取被引用的文件内容并替换
function resolveIncludes(content: string, baseDir: string): string {
  const includeRegex = /!!!include\(([^)]+)\)!!!/g
  let result = content
  
  let match
  while ((match = includeRegex.exec(content)) !== null) {
    const includePath = match[1]
    const fullPath = resolve(baseDir, includePath)
    
    try {
      if (fs.existsSync(fullPath)) {
        const includedContent = fs.readFileSync(fullPath, 'utf-8')
        // 移除 included 文件的 frontmatter（如果有）
        const { content: includedMarkdown } = parseFrontmatter(includedContent)
        // 递归处理 included 文件中的 include
        const resolvedContent = resolveIncludes(includedMarkdown, path.dirname(fullPath))
        result = result.replace(match[0], resolvedContent)
      }
    } catch (e) {
      // 如果文件不存在或读取失败，保留原始的 include 语句
      console.warn(`Warning: Could not include file: ${fullPath}`, e)
    }
  }
  
  return result
}

// 提取文章摘要的函数 - 返回 Markdown 格式
function extractExcerptMarkdown(content: string, baseDir: string, maxLength: number = 450): string {
  // 移除 frontmatter
  let text = content.replace(/^---[\s\S]*?---\n/, '')
  
  // 移除 frontmatter 后的空行
  text = text.replace(/^\n+/, '')
  
  // 按段落处理，跳过复杂内容块和 include 语句
  const lines = text.split('\n')
  const processedLines: string[] = []
  const countedParts: string[] = []
  let inCodeBlock = false
  let inContainer = false
  let inMermaid = false
  let inDetails = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // 跳过 include 语句（不展开它们，避免摘要包含全文）
    if (line.trim().match(/^!!!include\(.+\)!!!/)) {
      continue
    }
    
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
    
    // 处理 details 折叠块：仅保留 <details>/<summary> 标签行，跳过内部正文
    const trimmed = line.trim()
    if (trimmed.startsWith('<details')) {
      inDetails = true
      // 保留 details 起始行（在摘要里显示折叠控件）
      processedLines.push(line)
      continue
    }
    if (inDetails) {
      if (trimmed.startsWith('</details')) {
        inDetails = false
        // 结束标签需要加入摘要，避免后续内容被误包裹在 details 内
        processedLines.push(line)
        continue
      }
      // 仅保留 summary 行，其它折叠内部内容跳过
      if (trimmed.startsWith('<summary') || trimmed.startsWith('</summary')) {
        processedLines.push(line)
        countedParts.push(line)
        // summary 文本参与长度/行数统计
        const currentText = countedParts.join('\n\n')
        if (currentText.length > maxLength || countedParts.length >= 7) {
          break
        }
        continue
      }
      // details 内部正文：保留但不参与统计
      processedLines.push(line)
      continue
    }

    // 跳过代码块和容器块内的内容
    if (inCodeBlock || inContainer) {
      continue
    }
    
    // 跳过复杂内容（但保留图片和标题）
    const isHtmlTagLine = trimmed.startsWith('<') && trimmed.endsWith('>')

    if (
      isHtmlTagLine ||
      trimmed.startsWith('|') || // 表格行
      trimmed.match(/^---+$/) // 分隔线
    ) {
      continue
    }
    
    // 如果这一行有内容，添加到摘要
    if (line.trim()) {
      processedLines.push(line)
      countedParts.push(line)
      // 如果字符数超过限制或已经有 7 行或更多，停止
      const currentText = countedParts.join('\n\n')
      if (currentText.length > maxLength || countedParts.length >= 7) {
        break
      }
    }
  }
  
  const result = processedLines.join('\n\n').trim()
  return result || ''
}

export default {
  watch: [
    resolve(__dirname, './**/*.md'),
    // 监听 .articles 下的 markdown，确保 include 源变更能触发重载
    resolve(__dirname, '../.articles/**/*.md')
  ],
  load(watchedFiles: any[]) {
    const baseDir = resolve(__dirname)
    const docsDir = resolve(baseDir, '..')
    const articlesDir = resolve(docsDir, '.articles')

    const articles = watchedFiles
      .filter((file: string) => {
        const normalizedFile = resolve(file)
        const filename = path.basename(normalizedFile)
        
        // 排除特定文件名
        if (excludedFiles.includes(filename)) {
          return false
        }
        
        // 排除 .articles 目录下的文件（它们只是被 include 的内容，不是独立文章）
        const normalizedArticlesDir = resolve(articlesDir)
        if (normalizedFile.startsWith(normalizedArticlesDir)) {
          return false
        }
        
        // 只处理 src/ 目录下的文件
        const normalizedBaseDir = resolve(baseDir)
        return normalizedFile.startsWith(normalizedBaseDir)
      })
      .map((articleFile: string) => {
        const articleContent = fs.readFileSync(articleFile, 'utf-8')
        const { data, content } = parseFrontmatter(articleContent)
        const relativePath = relative(baseDir, articleFile).replace(/\\/g, '/').replace(/\.md$/, '')
        const normalizedPath = `/${relativePath}`

        // 计算标题：优先 frontmatter.title，否则回退到正文或 include 的首个 h1
        let title: string | undefined = (data as any).title
        const firstH1 = (mdText: string): string | undefined => {
          const m = mdText.match(/^#\s+(.+)$/m)
          return m ? m[1].trim() : undefined
        }

        // 提取摘要，优先使用 frontmatter 中的 excerpt，否则自动提取
        let excerptMarkdown = data.excerpt
        if (!excerptMarkdown) {
          // 检查内容中是否有 include 语句
          const includeMatch = content.match(/!!!include\(([^)]+)\)!!!/)
          if (includeMatch) {
            // 如果有 include，从被引用的文件（.articles 目录中的文件）提取摘要
            const includePath = includeMatch[1]
            // includePath 可能是 .articles/xxx 或 articles/xxx，需要统一处理
            // 从 src/ 目录向上找到 docs 目录，然后找到 .articles 目录
            const srcDir = resolve(baseDir)
            const docsDir = resolve(srcDir, '..')
            // 处理路径：如果包含 articles，替换为 .articles；如果已经是 .articles，保持不变
            const normalizedPath = includePath.replace(/^articles\//, '.articles/')
            const articlesFilePath = resolve(docsDir, normalizedPath)
            
            try {
              if (fs.existsSync(articlesFilePath)) {
                const articlesContent = fs.readFileSync(articlesFilePath, 'utf-8')
                if (!title) title = firstH1(articlesContent)
                // 从 .articles 文件内容中提取摘要（.articles 文件没有 frontmatter）
                excerptMarkdown = extractExcerptMarkdown(articlesContent, path.dirname(articlesFilePath), data.excerptLength || 250)
              } else {
                // 如果文件不存在，返回空摘要
                excerptMarkdown = ''
              }
            } catch (e) {
              // 如果读取失败，返回空摘要
              excerptMarkdown = ''
            }
          } else {
            // 没有 include，直接提取当前文件的摘要
            excerptMarkdown = extractExcerptMarkdown(content, path.dirname(articleFile), data.excerptLength || 250)
            if (!title) title = firstH1(content)
          }
        }
        // 使用 markdown-it 渲染摘要为 HTML
        const excerpt = excerptMarkdown ? md.render(excerptMarkdown) : ''

        return {
          ...data,
          title,
          path: normalizedPath,
          excerpt
        }
      })

    return articles
  },
}
