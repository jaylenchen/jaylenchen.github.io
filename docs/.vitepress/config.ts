import { resolve } from "node:path"
import { withMermaid } from 'vitepress-plugin-mermaid';
import { UserConfig, DefaultTheme, defineConfig, LocaleSpecificConfig } from 'vitepress';
import Components from 'unplugin-vue-components/vite';
import svgLoader from 'vite-svg-loader'
import mathjax3 from 'markdown-it-mathjax3';
import footnote from 'markdown-it-footnote';
import markdownItInclude from 'markdown-it-include';
import { installHeadingAutoNumber } from './markdown/heading-number'


import { Gepick } from './sidebar/technology/project/gepick'
import { Openwizard } from './sidebar/technology/project/openwizard'
import { Thinkto } from './sidebar/technology/project/thinkto'
import { Docker } from './sidebar/technology/common/docker'
import { Github } from './sidebar/technology/common/github'
import { Mermaid } from './sidebar/technology/common/mermaid'
import { Rust } from './sidebar/technology/common/rust'
import { Life } from "./sidebar/life";
import { copyAssetsToPublic } from './plugins/copy-assets-to-public'
import { watchIncludedMarkdown } from './plugins/watch-includes.ts'
import { sidebarTitles } from './plugins/sidebar-titles'


// #region theme config
namespace ThemeConfig {
  // used in components
  const customConfig = {
    // 自定义扩展: 文章元数据配置
    articleMetadataConfig: {
      author: 'jaylenchen', // 文章全局默认作者名称
      authorLink: 'https://github.com/jaylenchen', // 点击作者名时默认跳转的链接
      showViewCount: false, // 是否显示文章阅读数, 需要在 docs/.vitepress/theme/api/config.js 及 interface.js 配置好相应 API 接口
    },
    // 自定义扩展: 文章版权配置
    copyrightConfig: {
      license: '署名-相同方式共享 4.0 国际 (CC BY-SA 4.0)',
      licenseLink: 'http://creativecommons.org/licenses/by-sa/4.0/'
    },
  }

  type CustomConfig = typeof customConfig

  export const config = {
    // 配置首页左上角的icon+title
    logo: '/svgs/avatar.svg', // 首页左上角的icon
    siteTitle: 'jaylenchen', // 首页左上角的title
    outline: {
      level: 'deep',
      label: '目录',
    },
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜一搜',
                buttonAriaLabel: '搜一搜'
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换'
                }
              }
            }
          }
        }
      }
    },
    nav: [
      {
        activeMatch: '/technology/',
        text: '技术',
        items: [
          {
            text: '项目',
            items: [
              { text: 'Gepick', link: Gepick.base, activeMatch: `^${Gepick.base.replace(/\/$/, '')}(\/|$)` },
              { text: 'Openwizard', link: Openwizard.base, activeMatch: `^${Openwizard.base.replace(/\/$/, '')}(\/|$)` },
              { text: 'Thinkto', link: Thinkto.base, activeMatch: `^${Thinkto.base.replace(/\/$/, '')}(\/|$)` },
            ],
          },
          {
            text: '通用',
            items: [
              { text: 'Docker', link: Docker.base, activeMatch: `^${Docker.base.replace(/\/$/, '')}(\/|$)` },
              { text: 'Github', link: Github.base, activeMatch: `^${Github.base.replace(/\/$/, '')}(\/|$)` },
              { text: 'Mermaid', link: Mermaid.base, activeMatch: `^${Mermaid.base.replace(/\/$/, '')}(\/|$)` },
              { text: 'Rust', link: Rust.base, activeMatch: `^${Rust.base.replace(/\/$/, '')}(\/|$)` },
            ],
          },
        ],
      },
      {
        activeMatch: '^/life(\/|$)',
        text: '生活',
        link: Life.base,
      },
      {
        activeMatch: '^/tags(\/|$)',
        text: '标签',
        link: '/tags/',
      },
      {
        activeMatch: '^/about(\/|$)',
        text: '关于',
        link: '/about/',
      },
    ],
    sidebar: {
      // Technology
      [Gepick.base]: Gepick.items,
      [Openwizard.base]: Openwizard.items,
      [Thinkto.base]: Thinkto.items,
      [Docker.base]: Docker.items,
      [Github.base]: Github.items,
      [Mermaid.base]: Mermaid.items,
      [Rust.base]: Rust.items,
      // Life
      [Life.base]: Life.items
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    },
    editLink: {
      pattern: 'https://github.com/jaylenchen/jaylenchen.github.io/edit/main/packages/docs/src/:path',
      text: '在 GitHub 上编辑此页面'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/jaylenchen' },
    ],
    // footer: {
    //   copyright: '© 2025 Jaylenchen. All rights reserved.'
    // },
    langMenuLabel: '多语言',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    customConfig,
  } satisfies LocaleSpecificConfig<DefaultTheme.Config>['themeConfig'] & {
    customConfig: CustomConfig
  }
}
// #endregion




// #region site config
namespace SiteConfig {
  const docsConfig: UserConfig<DefaultTheme.Config> = {
    lang: 'zh-CN',
    title: 'jaylenchen',
    description: 'jaylenchen',
    head: [
      // 这里配置网站的logo，即网页tab上的logo图案
      ['link', { rel: 'icon', type: 'image/svg', href: '/svgs/avatar.svg' }],
    ],
    appearance: false
  }

  /**
 * Markdown-it 插件：转换图片路径
 * 将 .articles 目录中 markdown 的相对路径（../assets/... 或 ./assets/...）转换为绝对路径（/...）
 * 例如：../assets/life/gtd-process1.png -> /life/gtd-process1.png
 */
  function markdownItConvertAssetsPaths(md: any) {
    // 保存原始的 image 渲染规则
    const defaultImageRender = md.renderer.rules.image || ((tokens: any[], idx: number, options: any, env: any, self: any) => {
      return self.renderToken(tokens, idx, options);
    });

    // 重写 image 渲染规则，在渲染时转换路径并添加懒加载
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
        
        // 添加懒加载属性（除了第一张图片）
        if (idx > 0 || tokens.length > 1) {
          token.attrSet('loading', 'lazy');
          token.attrSet('decoding', 'async');
        }
      }

      return defaultImageRender(tokens, idx, options, env, self);
    };
  }

  const customElements = [
    'mjx-container',
    'mjx-assistive-mml',
    'math',
    'maction',
    'maligngroup',
    'malignmark',
    'menclose',
    'merror',
    'mfenced',
    'mfrac',
    'mi',
    'mlongdiv',
    'mmultiscripts',
    'mn',
    'mo',
    'mover',
    'mpadded',
    'mphantom',
    'mroot',
    'mrow',
    'ms',
    'mscarries',
    'mscarry',
    'mscarries',
    'msgroup',
    'mstack',
    'mlongdiv',
    'msline',
    'mstack',
    'mspace',
    'msqrt',
    'msrow',
    'mstack',
    'mstack',
    'mstyle',
    'msub',
    'msup',
    'msubsup',
    'mtable',
    'mtd',
    'mtext',
    'mtr',
    'munder',
    'munderover',
    'semantics',
    'math',
    'mi',
    'mn',
    'mo',
    'ms',
    'mspace',
    'mtext',
    'menclose',
    'merror',
    'mfenced',
    'mfrac',
    'mpadded',
    'mphantom',
    'mroot',
    'mrow',
    'msqrt',
    'mstyle',
    'mmultiscripts',
    'mover',
    'mprescripts',
    'msub',
    'msubsup',
    'msup',
    'munder',
    'munderover',
    'none',
    'maligngroup',
    'malignmark',
    'mtable',
    'mtd',
    'mtr',
    'mlongdiv',
    'mscarries',
    'mscarry',
    'msgroup',
    'msline',
    'msrow',
    'mstack',
    'maction',
    'semantics',
    'annotation',
    'annotation-xml',
  ]

  const buildConfig: UserConfig<DefaultTheme.Config> = {
    base: '/',
    srcDir: resolve(__dirname, '../src'),
    head: [
      // Favicon - 浏览器 tab 的 logo
      ['link', { rel: 'icon', type: 'image/svg+xml', href: '/svgs/avatar.svg' }],
      // DNS 预解析和预连接
      ['link', { rel: 'dns-prefetch', href: 'https://api.github.com' }],
      ['link', { rel: 'preconnect', href: 'https://api.github.com', crossorigin: '' }],
      // 字体预加载 - 只预加载首屏最常用的字体，避免警告并防止闪烁
      ['link', { rel: 'preconnect', href: 'https://gw.alipayobjects.com', crossorigin: 'anonymous' }],
      ['link', { rel: 'preload', href: 'https://gw.alipayobjects.com/os/k/jinkai/tsanger-jinkai-w04-subset-119.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' }],
      // 资源提示
      ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' }],
      ['meta', { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' }],
    ],
    rewrites: {
      'technology/project/gepick/index.md': 'technology/project/gepick.md',
      'technology/project/openwizard/index.md': 'technology/project/openwizard.md',
      'technology/project/thinkto/index.md': 'technology/project/thinkto.md',
      'technology/project/tsalg/index.md': 'technology/project/tsalg.md',
      'technology/common/docker/index.md': 'technology/common/docker.md',
      'technology/common/rust/index.md': 'technology/common/rust.md',
      'technology/common/mermaid/index.md': 'technology/common/mermaid.md',
      'technology/common/github/index.md': 'technology/common/github.md',
      'life/index.md': 'life.md'
    },
    markdown: {
      // Shiki主题, 所有主题参见: https://github.com/shikijs/shiki/blob/main/docs/themes.md
      theme: {
        light:'dracula-soft',
        dark: 'dracula-soft'
      },
      // lineNumbers: true, // 启用行号

      config: (md) => {
        md.use(mathjax3);
        md.use(footnote);

        // 启用 markdown 文件引入功能
        // 使用方式: !!!include(path/to/file.md)!!!
        // 参考: https://www.npmjs.com/package/markdown-it-include
        md.use(markdownItInclude, {
          // config.ts 位于 docs/.vitepress，因此上一级就是 docs/
          root: resolve(__dirname, '../')
        });

        // 转换 assets 路径 - 在 include 之后执行，确保处理 include 进来的内容
        md.use(markdownItConvertAssetsPaths);

        // 为 h2–h6 自动添加分级编号（h1 不编号）：h2 中文、h3+ 阿拉伯
        installHeadingAutoNumber(md as any)

        // 在所有文档的<h1>标签后添加<ArticleMetadata/>组件
        md.renderer.rules.heading_close = (tokens, idx, options, env, slf) => {
          let htmlResult = slf.renderToken(tokens, idx, options);
          if (tokens[idx].tag === 'h1') htmlResult += `\n<ClientOnly><ArticleMetadata v-if="($frontmatter?.aside ?? true) && ($frontmatter?.showArticleMetadata ?? true)" :article="$frontmatter" /></ClientOnly>`;

          return htmlResult;
        }
      },
    },
    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag) => customElements.includes(tag),
        },
      },
    },
    vite: {
      plugins: [
        Components({
          dirs: ['.vitepress/theme/components'],
          include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        }),
        svgLoader(),
        watchIncludedMarkdown(),
        sidebarTitles(),
        copyAssetsToPublic()
      ],
      resolve: {
        alias: {
          'mermaid': 'mermaid/dist/mermaid.esm.mjs',
          "@blog/docs": resolve(__dirname, "../src"),
          "@blog/theme": resolve(__dirname, "../../theme/src"),
        },
      },
      optimizeDeps: {
        include: ['mark.js/vanilla'],
        esbuildOptions: {
          target: 'esnext',
        },
      },
      ssr: {
        noExternal: ['mark.js'],
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Ant Design Vue
              if (id.includes('ant-design-vue')) {
                return 'ant-design';
              }
              // Mermaid
              if (id.includes('mermaid')) {
                return 'mermaid';
              }
              // MathJax
              if (id.includes('mathjax')) {
                return 'mathjax';
              }
              // Vue 核心
              if (id.includes('vue') && !id.includes('node_modules')) {
                return 'vue-core';
              }
              // node_modules 中的其他大型库
              if (id.includes('node_modules')) {
                if (id.includes('vitepress')) {
                  return 'vitepress';
                }
                return 'vendor';
              }
            }
          }
        },
        // 优化构建
        chunkSizeWarningLimit: 1000,
        cssCodeSplit: false, // 禁用 CSS 代码分割，确保所有 CSS 正确加载
        minify: 'esbuild', // 使用 esbuild 压缩（VitePress 默认）
      }
    }
  }


  export const config: Omit<UserConfig<DefaultTheme.Config>, 'themeConfig'> = {
    ...docsConfig,
    ...buildConfig,
    cleanUrls: true,
  }
}

// #endregion


export default withMermaid(defineConfig({
  themeConfig: ThemeConfig.config,
  ...SiteConfig.config,
}))