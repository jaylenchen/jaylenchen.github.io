import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

function resolveMdFileFromLink(link: string): string | null {
  const base = resolve(__dirname, '../../src')
  const clean = link.replace(/^\//, '')
  const direct = resolve(base, clean + '.md')
  if (existsSync(direct)) return direct
  const index = resolve(base, clean, 'index.md')
  if (existsSync(index)) return index
  return null
}

export function getH1TitleForLink(link: string): string | undefined {
  try {
    const file = resolveMdFileFromLink(link)
    if (!file) return undefined
    const content = readFileSync(file, 'utf-8')
    const m = content.match(/^#\s+(.+)$/m)
    if (m) return m[1].trim()
    // support !!!include(.articles/...)!!!
    const include = content.match(/!!!include\(([^)]+)\)!!!/)
    if (include) {
      // docs/.vitepress/helpers → docs
      const docsDir = resolve(__dirname, '../..')
      const normalized = include[1].replace(/^articles\//, '.articles/')
      const included = resolve(docsDir, normalized)
      if (existsSync(included)) {
        const includedContent = readFileSync(included, 'utf-8')
        const h1 = includedContent.match(/^#\s+(.+)$/m)
        if (h1) return h1[1].trim()
      }
    }
    return undefined
  } catch {
    return undefined
  }
}


