import type { Plugin } from 'vite'
import fs from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

let __dirname = ''
try {
  const __filename = fileURLToPath(import.meta.url)
  __dirname = dirname(__filename)
} catch {
  __dirname = process.cwd()
}

/**
 * 递归读取目录下的所有 markdown 文件
 */
// 排除的文件列表
const excludedFiles = ['index.md', 'tags.md', 'archives.md', 'about.md']

function getAllMarkdownFiles(dir: string, baseDir: string): string[] {
  const files: string[] = []
  
  if (!fs.existsSync(dir)) {
    return files
  }
  
  const entries = fs.readdirSync(dir)
  
  for (const entry of entries) {
    const fullPath = resolve(dir, entry)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath, baseDir))
    } else if (entry.endsWith('.md') && !excludedFiles.includes(entry)) {
      const relativePath = relative(baseDir, fullPath).replace(/\\/g, '/')
      files.push(relativePath)
    }
  }
  
  return files
}

/**
 * 生成 markdown 内容索引
 */
export function generateMarkdownIndex(): Plugin {
  let docsDir = ''
  let publicDir = ''
  let outputFile = ''
  
  return {
    name: 'generate-markdown-index',
    configResolved() {
      // 解析路径
      try {
        const __filename = fileURLToPath(import.meta.url)
        const __dirname = dirname(__filename)
        docsDir = resolve(__dirname, '../../src')
        publicDir = resolve(__dirname, '../../src/public')
      } catch {
        docsDir = resolve(process.cwd(), 'src')
        publicDir = resolve(process.cwd(), 'src/public')
      }
      outputFile = resolve(publicDir, '.vitepress/markdown-index.json')
    },
    buildStart() {
      console.log('[generate-markdown-index] Scanning markdown files...')
      
      const mdFiles = getAllMarkdownFiles(docsDir, docsDir)
      const index: Record<string, string> = {}
      
      for (const file of mdFiles) {
        const fullPath = resolve(docsDir, file)
        try {
          const content = fs.readFileSync(fullPath, 'utf-8')
          // 使用相对路径作为 key（不包含 .md 后缀）
          const key = file.replace(/\.md$/, '')
          index[key] = content
        } catch (error) {
          console.warn(`[generate-markdown-index] Failed to read ${file}:`, error)
        }
      }
      
      // 确保输出目录存在
      const outputDir = dirname(outputFile)
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      
      // 写入索引文件
      fs.writeFileSync(outputFile, JSON.stringify(index, null, 2), 'utf-8')
      
      console.log(`[generate-markdown-index] Generated index with ${Object.keys(index).length} files at ${outputFile}`)
    },
    // 在开发模式下也生成索引
    configureServer(server) {
      const generate = () => {
        const mdFiles = getAllMarkdownFiles(docsDir, docsDir)
        const index: Record<string, string> = {}
        
        for (const file of mdFiles) {
          const fullPath = resolve(docsDir, file)
          try {
            const content = fs.readFileSync(fullPath, 'utf-8')
            const key = file.replace(/\.md$/, '')
            index[key] = content
          } catch (error) {
            // 忽略错误
          }
        }
        
        const outputDir = dirname(outputFile)
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true })
        }
        
        fs.writeFileSync(outputFile, JSON.stringify(index, null, 2), 'utf-8')
      }
      
      // 监听 markdown 文件变化
      server.watcher.on('change', (file) => {
        if (file.endsWith('.md') && file.includes('src/')) {
          generate()
        }
      })
      
      // 初始生成
      generate()
    }
  }
}

