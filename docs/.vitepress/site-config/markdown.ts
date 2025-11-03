import type { MarkdownOptions } from 'vitepress';
import mathjax3 from 'markdown-it-mathjax3';
import footnote from 'markdown-it-footnote';
import markdownItInclude from 'markdown-it-include';
import { resolve } from 'node:path';

/**
 * Markdown-it 插件：转换图片路径
 * 将 articles 目录中 markdown 的相对路径（../assets/... 或 ./assets/...）转换为绝对路径（/...）
 * 例如：../assets/life/gtd-process1.png -> /life/gtd-process1.png
 */
function markdownItConvertAssetsPaths(md: any) {
  // 保存原始的 image 渲染规则
  const defaultImageRender = md.renderer.rules.image || ((tokens: any[], idx: number, options: any, env: any, self: any) => {
    return self.renderToken(tokens, idx, options);
  });

  // 重写 image 渲染规则，在渲染时转换路径
  md.renderer.rules.image = (tokens: any[], idx: number, options: any, env: any, self: any) => {
    const token = tokens[idx];
    const src = token.attrGet('src');
    
    if (src) {
      // 匹配任意数量的 ../ 或 ./ 后跟 assets/ 的路径
      // 例如：../../../../assets/xxx.png, ../assets/xxx.png, ./assets/xxx.png, assets/xxx.png
      const assetsMatch = src.match(/(?:\.\.\/|\.\/)*assets\/(.+)$/);
      if (assetsMatch) {
        // 转换为绝对路径：/path/to/file
        const newPath = `/${assetsMatch[1]}`;
        token.attrSet('src', newPath);
      }
    }
    
    return defaultImageRender(tokens, idx, options, env, self);
  };
}

export const markdown: MarkdownOptions = {
  // Shiki主题, 所有主题参见: https://github.com/shikijs/shiki/blob/main/docs/themes.md
  theme: {
    light: 'github-light',
    dark: 'github-dark-dimmed'
  },
  // lineNumbers: true, // 启用行号

  config: (md) => {
    md.use(mathjax3);
    md.use(footnote);
    
    // 启用 markdown 文件引入功能
    // 使用方式: !!!include(path/to/file.md)!!!
    // 参考: https://www.npmjs.com/package/markdown-it-include
    md.use(markdownItInclude, {
      root: resolve(__dirname, '../../')
    });
    
    // 转换 assets 路径 - 在 include 之后执行，确保处理 include 进来的内容
    md.use(markdownItConvertAssetsPaths);

    // 在所有文档的<h1>标签后添加<ArticleMetadata/>组件
    md.renderer.rules.heading_close = (tokens, idx, options, env, slf) => {
      let htmlResult = slf.renderToken(tokens, idx, options);
      if (tokens[idx].tag === 'h1') htmlResult += `\n<ClientOnly><ArticleMetadata v-if="($frontmatter?.aside ?? true) && ($frontmatter?.showArticleMetadata ?? true)" :article="$frontmatter" /></ClientOnly>`;

      return htmlResult;
    }
  },
};
