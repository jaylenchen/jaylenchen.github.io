import type MarkdownIt from 'markdown-it'

/**
 * Install heading auto-numbering for h2–h6.
 * Rules per requirement:
 * - h1: no numbering
 * - h2: Chinese numerals + '、' (一、二、三、...)
 * - h3+: Arabic hierarchical (1.1, 1.2, 2.1.1 ...)
 * - Resets per document render
 */
export function installHeadingAutoNumber(md: MarkdownIt) {
  const toCN = (n: number): string => {
    const num = ['零','一','二','三','四','五','六','七','八','九']
    if (n <= 10) return n === 10 ? '十' : num[n]
    if (n < 20) return '十' + num[n % 10]
    if (n < 100) {
      const t = Math.floor(n / 10)
      const o = n % 10
      return num[t] + '十' + (o ? num[o] : '')
    }
    return String(n)
  }

  md.core.ruler.push('heading_auto_number', (state: any) => {
    const counters: number[] = [0, 0, 0, 0, 0] // h2..h6
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]
      if (t.type !== 'heading_open') continue
      const level = parseInt(t.tag.slice(1), 10)
      if (level <= 1 || level > 6) continue // skip h1

      const idx = level - 2 // h2 => 0
      counters[idx]++
      for (let j = idx + 1; j < counters.length; j++) counters[j] = 0

      let numbering = ''
      if (level === 2) {
        numbering = toCN(counters[0]) + '、'
      } else {
        const parts: string[] = []
        for (let j = 0; j <= idx; j++) parts.push(String(counters[j]))
        numbering = parts.join('.') + ' '
      }

      const inline = tokens[i + 1]
      if (inline && inline.type === 'inline') {
        const span = new state.Token('html_inline', '', 0)
        span.content = `<span class=\"heading-number\">${numbering}</span>`
        inline.children = inline.children || []
        inline.children.unshift(span)
      }
    }
    return true
  })
}


