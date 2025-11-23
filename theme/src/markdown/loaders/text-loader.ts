/**
 * Text Loader - 处理 markdown 中的文本内容
 * 包括段落、标题、列表等基础文本元素
 * 使用 markdown-it 的默认渲染即可
 */

/**
 * 创建文本渲染规则
 * 使用 markdown-it 的默认渲染
 */
export function createTextRenderer() {
  // markdown-it 的默认文本渲染已经足够
  // 我们不需要在这里做特殊处理
  return null; // 返回 null 表示使用默认渲染
}

