/**
 * Code Loader - 处理 markdown 中的代码块
 * 代码高亮由 Shiki 在客户端完成（在 anchor/AnchorPreview.vue 中）
 * 这里只负责保留代码块的结构和语言标识
 */

/**
 * 创建代码块渲染规则
 * 使用 markdown-it 的默认渲染，保留语言标识
 */
export function createCodeRenderer() {
  // markdown-it 的默认代码块渲染已经足够
  // 我们不需要在这里做特殊处理，代码高亮会在客户端通过 Shiki 完成
  return null; // 返回 null 表示使用默认渲染
}

