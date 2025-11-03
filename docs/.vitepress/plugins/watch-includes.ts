import type { Plugin } from 'vite'
import fs from 'node:fs'
import path, { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Vite 插件：为包含 !!!include(.articles/...)!!! 的 markdown 建立依赖关系
// 目的：当 .articles 下的被包含文件变化时，Vite 能自动触发引用该文件的 .md 模块的 HMR
export function watchIncludedMarkdown(): Plugin {
  let docsDir = ''
  let articlesDir = ''

  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    docsDir = resolve(__dirname, '../..')
    articlesDir = resolve(docsDir, '.articles')
  } catch {
    docsDir = process.cwd()
    articlesDir = resolve(docsDir, '.articles')
  }

  const includeRe = /!!!include\(([^)]+)\)!!!/g
  const includeToParents = new Map<string, Set<string>>() // absIncluded -> Set(parentId)

  return {
    name: 'watch-included-markdown',
    apply: 'serve',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.md')) return null

      let mutated = code
      let changed = false
      let match: RegExpExecArray | null
      includeRe.lastIndex = 0
      while ((match = includeRe.exec(code)) !== null) {
        const raw = match[1]
        const normalized = raw.replace(/^articles\//, '.articles/')
        const abs = resolve(docsDir, normalized)
        if (!abs.startsWith(articlesDir)) continue

        // 建立依赖
        // @ts-ignore
        this.addWatchFile(abs)
        // 记录父子关系用于 HMR
        if (!includeToParents.has(abs)) includeToParents.set(abs, new Set())
        includeToParents.get(abs)!.add(id)

        // 读取 mtime，用于注入指纹，确保父模块在子文件变化时产生新内容
        let mtime = 0
        try {
          const stat = fs.statSync(abs)
          mtime = stat.mtimeMs
        } catch {}

        const marker = `<!-- include-mtime:${path.relative(docsDir, abs).replace(/\\/g,'/')}:${mtime} -->`
        const full = match[0]
        // 如果还未包含我们注入的指纹，则追加一行
        if (!code.includes(marker)) {
          mutated = mutated.replace(full, `${full}\n${marker}`)
          changed = true
        } else {
          // 已有指纹则更新（保证当 mtime 变化时内容变化）
          const markerRe = new RegExp(`<!-- include-mtime:${escapeReg(path.relative(docsDir, abs).replace(/\\/g,'/'))}:[0-9.]+ -->`)
          mutated = mutated.replace(markerRe, marker)
          changed = true
        }
      }

      return changed ? { code: mutated, map: null } : null
    },
    handleHotUpdate({ file, server }) {
      // .articles 文件变化，找到所有父级 markdown 模块并返回
      if (!file.startsWith(articlesDir)) return
      const parents = includeToParents.get(file)
      if (!parents || parents.size === 0) return
      const modules: any[] = []
      parents.forEach(parentId => {
        const mod = server.moduleGraph.getModuleById(parentId)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          modules.push(mod)
        }
      })
      if (modules.length > 0) return modules
    }
  }
}

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}


