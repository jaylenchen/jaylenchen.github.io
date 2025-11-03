import type { Plugin } from 'vite'
import fs from 'node:fs'
import path, { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Vite 插件：为包含 !!!include(.articles/...)!!! 的 markdown 建立依赖关系
// 目的：当 .articles 下的被包含文件变化时，Vite 能自动触发引用该文件的 .md 模块的 HMR
export function watchIncludedMarkdown(): Plugin {
  let docsDir = ''
  let articlesDir = ''
  let sidebarDir = ''
  let lastReloadAt = 0
  const VIRTUAL_ID = 'virtual:sidebar-mtime'
  let configPath = ''

  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    docsDir = resolve(__dirname, '../..')
    articlesDir = resolve(docsDir, '.articles')
    sidebarDir = resolve(docsDir, '.vitepress/sidebar')
    configPath = resolve(docsDir, '.vitepress/config.ts')
  } catch {
    docsDir = process.cwd()
    articlesDir = resolve(docsDir, '.articles')
    sidebarDir = resolve(docsDir, '.vitepress/sidebar')
    configPath = resolve(docsDir, '.vitepress/config.ts')
  }

  const includeRe = /!!!include\(([^)]+)\)!!!/g
  const includeToParents = new Map<string, Set<string>>() // absIncluded -> Set(parentId)

  return {
    name: 'watch-included-markdown',
    apply: 'serve',
    enforce: 'pre',
    resolveId(id) {
      if (id === VIRTUAL_ID) return id
      return null
    },
    load(id) {
      if (id === VIRTUAL_ID) {
        return `export const sidebarMtime = ${Date.now()}`
      }
      return null
    },
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
      // 为了稳定性，统一对相关变更触发全量刷新，避免选择性失效导致的运行时异常
      const isMdChange = file.endsWith('.md')
      const isArticlesChange = file.startsWith(articlesDir)
      if (isMdChange || isArticlesChange) {
        // 无效化虚拟模块以促使依赖它的侧边栏文件重新评估
        const vmod = server.moduleGraph.getModuleById(VIRTUAL_ID)
        if (vmod) {
          try { server.moduleGraph.invalidateModule(vmod) } catch {}
          server.ws.send({ type: 'update', updates: [{ type: 'js-update', path: VIRTUAL_ID, acceptedPath: VIRTUAL_ID, timestamp: Date.now() }] })
        }

        // 同时无效化所有侧边栏相关模块，确保重新执行读取 h1 的逻辑
        server.moduleGraph.idToModuleMap.forEach((m) => {
          const id = m.id || ''
          if (id.includes('/.vitepress/sidebar/')) {
            try { server.moduleGraph.invalidateModule(m) } catch {}
          }
        })

        // 关键：无效化 config.ts，以便 VitePress 重新评估 themeConfig.sidebar
        const cfg = server.moduleGraph.getModuleById(configPath)
        if (cfg) {
          try { server.moduleGraph.invalidateModule(cfg) } catch {}
        }
        const now = Date.now()
        if (now - lastReloadAt > 250) {
          lastReloadAt = now
          try { server.ws.send({ type: 'full-reload' }) } catch {}
        }
      }
      return []
    }
  }
}

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}


