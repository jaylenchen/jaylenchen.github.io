/**
 * Image Loader - 处理 markdown 中的图片路径转换
 * 复用 config.ts 中的 markdownItConvertAssetsPaths 逻辑
 */

/**
 * 根据 markdown 文件路径和图片相对路径，解析为绝对路径
 * @param markdownPath markdown 文件路径（如 "technology/project/gepick/basic/xxx"）
 * @param imagePath 图片相对路径（如 "../assets/cli-system.png"）
 * @returns 绝对路径（如 "/technology/project/gepick/basic/cli-system.png"）
 */
export function resolveImagePath(markdownPath: string, imagePath: string): string {
  // 如果已经是绝对路径或外部链接，直接返回
  if (imagePath.startsWith('/') || imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // 获取 markdown 文件所在目录
  // 例如：technology/project/gepick/basic/xxx -> technology/project/gepick/basic/
  const markdownDir = markdownPath.split('/').slice(0, -1).join('/')
  
  // 处理相对路径
  if (imagePath.startsWith('./') || imagePath.startsWith('../')) {
    // 匹配 ../assets/ 或 ./assets/ 或 assets/
    // 复用 config.ts 中的逻辑：匹配任意数量的 ../ 或 ./ 后跟 assets/ 的路径
    const assetsMatch = imagePath.match(/(?:\.\.\/|\.\/)*assets\/(.+)$/);
    if (assetsMatch) {
      // 如果图片路径是 ../assets/xxx.png，图片实际在 markdown 文件同目录下
      // 例如：technology/project/gepick/basic/xxx.md 引用 ../assets/cli-system.png
      // 图片实际在 public/technology/project/gepick/basic/cli-system.png
      // 所以路径应该是 /technology/project/gepick/basic/cli-system.png
      const imageName = assetsMatch[1]
      if (markdownDir) {
        return `/${markdownDir}/${imageName}`
      } else {
        return `/${imageName}`
      }
    } else {
      // 处理其他相对路径
      // 解析相对路径
      const parts = imagePath.split('/')
      let currentDir = markdownDir.split('/')
      
      for (const part of parts) {
        if (part === '..') {
          currentDir.pop()
        } else if (part !== '.' && part !== '') {
          currentDir.push(part)
        }
      }
      
      return '/' + currentDir.join('/')
    }
  } else {
    // 没有前缀的路径，可能是相对于 public 目录的
    // 如果 markdown 文件有目录，图片应该在同目录下
    if (markdownDir) {
      return `/${markdownDir}/${imagePath}`
    } else {
      return `/${imagePath}`
    }
  }
}

/**
 * 创建图片渲染规则
 * 复用 config.ts 中的 markdownItConvertAssetsPaths 逻辑
 */
export function createImageRenderer(markdownPath?: string) {
  return (tokens: any[], idx: number, options: any, env: any, self: any) => {
    const defaultImageRender = self.renderToken || ((tokens: any[], idx: number, options: any, env: any, self: any) => {
      return self.renderToken(tokens, idx, options);
    });

    const token = tokens[idx];
    const src = token.attrGet('src');

    if (src) {
      let resolvedSrc = src;
      
      // 如果有 markdown 路径，使用路径解析
      if (markdownPath) {
        resolvedSrc = resolveImagePath(markdownPath, src);
      } else {
        // 复用 config.ts 中的逻辑：匹配任意数量的 ../ 或 ./ 后跟 assets/ 的路径
        const assetsMatch = src.match(/(?:\.\.\/|\.\/)*assets\/(.+)$/);
        if (assetsMatch) {
          // 转换为绝对路径：/path/to/file
          resolvedSrc = `/${assetsMatch[1]}`;
        }
      }
      
      token.attrSet('src', resolvedSrc);
      
      // 添加懒加载属性（除了第一张图片）
      // 复用 config.ts 中的逻辑
      if (idx > 0 || tokens.length > 1) {
        token.attrSet('loading', 'lazy');
        token.attrSet('decoding', 'async');
      }
    }

    return defaultImageRender(tokens, idx, options, env, self);
  };
}

