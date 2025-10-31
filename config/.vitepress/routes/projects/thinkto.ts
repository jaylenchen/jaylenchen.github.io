import { DefaultTheme } from 'vitepress';

enum Article {
  image_upload = '几种图片上传交互处理',
  thinkto_cicd = "关于我在startup项目中接入CI的经历"
}

const thinkto = (subPath: string) => '/project/thinkto' + subPath

const nav = { text: 'thinkto', link: thinkto('/' + Article.image_upload) }

const fileItems: DefaultTheme.SidebarItem[] = [
  {
    text: Article.image_upload,
    link: thinkto('/' + Article.image_upload)
  }
]

const releaseItems: DefaultTheme.SidebarItem[] = [
  {
    text: Article.thinkto_cicd,
    link: thinkto('/' + Article.thinkto_cicd)
  }
]
const sidebar: DefaultTheme.Config['sidebar'] = {
  [thinkto('/')]: [...fileItems, ...releaseItems]
}

export default {
  nav,
  sidebar
}
