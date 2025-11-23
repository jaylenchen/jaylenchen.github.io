/**
 * Markdown Renderer Factory - 创建 markdown 渲染器
 * 复用 config.ts 中的配置，使用模块化的 loader
 */

import { createImageRenderer } from './image-loader'

// 延迟加载 markdown-it（仅在客户端使用）
let md: any = null

/**
 * 创建 markdown 渲染器
 * 复用 config.ts 中的配置逻辑
 * @param markdownPath markdown 文件路径（可选，用于解析图片路径）
 */
export async function createMarkdownRenderer(markdownPath?: string) {
  // 如果已经有 renderer，更新图片路径转换逻辑
  if (md) {
    if (markdownPath) {
      md.renderer.rules.image = createImageRenderer(markdownPath)
    }
    return md
  }
  
  // 动态导入 markdown-it 及其插件
  const MarkdownIt = (await import('markdown-it')).default
  const mathjax3 = (await import('markdown-it-mathjax3')).default
  const footnote = (await import('markdown-it-footnote')).default
  
  // 创建 markdown 渲染器（与 VitePress config.ts 配置保持一致）
  md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false
  })
  
  // 使用图片 loader
  md.renderer.rules.image = createImageRenderer(markdownPath)
  
  // 添加 markdown-it-include 支持（处理 !!!include()!!! 语句）
  // 复用 config.ts 中的配置
  try {
    const markdownItInclude = (await import('markdown-it-include')).default
    md.use(markdownItInclude, {
      // 注意：在客户端无法访问文件系统，所以 include 可能无法工作
      // 但至少不会报错
    })
  } catch (error) {
    console.debug('markdown-it-include not available:', error)
  }
  
  // 添加自定义块支持（:::note, :::tip, :::warning 等）
  // 复用 config.ts 中的配置思路
  try {
    const containerModule = await import('markdown-it-container')
    const container = containerModule.default || containerModule || (containerModule as any)
    const types = ['note', 'tip', 'warning', 'danger', 'info']
    types.forEach(type => {
      md.use(container, type, {
        render: function (tokens: any[], idx: number) {
          const token = tokens[idx]
          const info = token.info.trim().slice(type.length).trim()
          if (token.nesting === 1) {
            return `<div class="custom-block ${type}"><p class="custom-block-title">${info || type.toUpperCase()}</p>\n`
          } else {
            return '</div>\n'
          }
        }
      })
    })
  } catch (error) {
    console.debug('markdown-it-container not available, using fallback for custom blocks:', error)
  }
  
  // 添加 MathJax 和 footnote 支持
  // 复用 config.ts 中的配置
  md.use(mathjax3)
  md.use(footnote)
  
  return md
}

