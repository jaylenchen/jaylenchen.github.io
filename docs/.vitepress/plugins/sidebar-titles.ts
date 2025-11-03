import type { Plugin } from 'vite'
import fs from 'node:fs'
import { resolve, dirname } from 'node:path'

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

function readH1FromContent(md: string): string | undefined {
  const m = md.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : undefined
}

function resolveIncludedContent(docsDir: string, content: string): string | undefined {
  const inc = content.match(/!!!include\(([^)]+)\)!!!/)
  if (!inc) return undefined
  const normalized = inc[1].replace(/^articles\//, '.articles/')
  const includedPath = resolve(docsDir, normalized)
  if (fs.existsSync(includedPath)) return fs.readFileSync(includedPath, 'utf-8')
  return undefined
}

function buildTitlesMap(docsDir: string): Record<string, string> {
  const srcDir = resolve(docsDir, 'src')
  const map: Record<string, string> = {}

  const walk = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const e of entries) {
      const full = resolve(dir, e.name)
      if (e.isDirectory()) {
        walk(full)
      } else if (e.isFile() && e.name.endsWith('.md')) {
        const rel = full.slice(srcDir.length).replace(/\\/g, '/').replace(/\.md$/, '')
        const link = rel.startsWith('/') ? rel : `/${rel}`
        const content = fs.readFileSync(full, 'utf-8')
        let title = readH1FromContent(content)
        if (!title) {
          const incContent = resolveIncludedContent(docsDir, content)
          if (incContent) title = readH1FromContent(incContent)
        }
        if (title) map[link] = title
      }
    }
  }

  walk(srcDir)
  return map
}

export function sidebarTitles(): Plugin {
  let docsDir = ''
  let cacheDir = ''
  let cacheFile = ''

  return {
    name: 'sidebar-titles-json',
    apply: 'serve',
    configResolved() {
      // docs/.vitepress/plugins/sidebar-titles.ts → docs
      docsDir = resolve(__dirname, '../..')
      cacheDir = resolve(docsDir, '.vitepress/.cache')
      cacheFile = resolve(cacheDir, 'sidebar-titles.json')
      ensureDir(cacheDir)
      const map = buildTitlesMap(docsDir)
      fs.writeFileSync(cacheFile, JSON.stringify(map, null, 2))
    },
    handleHotUpdate({ file, server }) {
      if (!file.endsWith('.md')) return
      try {
        const map = buildTitlesMap(docsDir)
        fs.writeFileSync(cacheFile, JSON.stringify(map, null, 2))
        server.ws.send({ type: 'full-reload' })
      } catch {}
    }
  }
}


