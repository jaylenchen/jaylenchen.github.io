import { DefaultTheme } from 'vitepress';

enum Article {
  ImageUpload = '几种图片上传交互处理'
}

const thinkto = (subPath: string) => '/projects/thinkto' + subPath

const nav = { text: 'thinkto', link: thinkto('/' + Article.ImageUpload) }

const sidebar: DefaultTheme.Config['sidebar'] = {
  [thinkto('/')]: [
    {
      text: '文件业务',
      items: [
        {
          text: Article.ImageUpload,
          link: thinkto('/' + Article.ImageUpload)
        },
      ],
      collapsed: true
    },
  ]
}

export default {
  nav,
  sidebar
}
