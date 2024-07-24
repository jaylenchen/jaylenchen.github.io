import { DefaultTheme } from 'vitepress';

enum Article {
  image_upload = '几种图片上传交互处理'
}

const thinkto = (subPath: string) => '/projects/thinkto' + subPath

const nav = { text: 'thinkto', link: thinkto('/' + Article.image_upload) }

const sidebar: DefaultTheme.Config['sidebar'] = {
  [thinkto('/')]: [
    {
      text: '文件业务',
      items: [
        {
          text: Article.image_upload,
          link: thinkto('/' + Article.image_upload)
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
