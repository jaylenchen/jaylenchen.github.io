import { DefaultTheme } from 'vitepress';

enum Article {
  image_upload = '几种图片上传交互处理',
  thinkto_cicd = "关于我在startup项目中接入CI的经历"
}

const THINKTO_BASE_PATH = '/technology/project/thinkto'

const thinkto = (subPath = '') =>
  subPath ? `${THINKTO_BASE_PATH}/${subPath.replace(/^\/+/, '')}` : THINKTO_BASE_PATH

const nav = {
  text: 'Thinkto',
  link: thinkto(),
  activeMatch: '^/technology/project/thinkto'
}

const fileItems: DefaultTheme.SidebarItem[] = [
  {
    text: Article.image_upload,
    link: thinkto(Article.image_upload)
  }
]

const releaseItems: DefaultTheme.SidebarItem[] = [
  {
    text: Article.thinkto_cicd,
    link: thinkto(Article.thinkto_cicd)
  }
]
const sidebar: DefaultTheme.Config['sidebar'] = {
  [THINKTO_BASE_PATH]: [...fileItems, ...releaseItems]
}

export default {
  nav,
  sidebar
}
