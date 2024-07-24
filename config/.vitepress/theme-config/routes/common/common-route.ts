import { DefaultTheme } from 'vitepress'

export const common = (subPath: string) => '/common' + subPath

enum Article {
  ImagePasteUpload = '图片粘贴上传'
}

const nav = { text: '通用', link: common('/'+ Article.ImagePasteUpload) }

const sidebar: DefaultTheme.Config['sidebar'] = {
  [common('/')]: [
    {
      text: '文件业务',
      items: [
        {
          text: Article.ImagePasteUpload,
          link: common('/' + Article.ImagePasteUpload)
        },
      ],
      collapsed: true
    }
  ]
}

export default {
  nav,
  sidebar
}
