import { DefaultTheme } from 'vitepress'

export const common = (subPath?: string) => '/common/' + subPath

/**
 * nav用于配置顶部右侧导航栏的相关信息
 * 比如这里配置，text是顶部导航栏标题，那么顶部会出现一个标题为“顶部导航栏标题”的导航，点击之后会跳转到名称为“顶部导航栏点击之后要跳转的md文档具体文件路径/具体md文档名称”这个md文档
 */
const nav = { text: '顶部导航栏标题', link: "顶部导航栏点击之后要跳转的md文档具体文件路径/具体md文档名称" }

const sidebar: DefaultTheme.Config['sidebar'] = {
  [common()]: [
    {
      text: '项目组织',
      items: [
        {
          text: '粘贴图片上传',
          link: common('粘贴图片上传')
        },
        {
          text: '粘贴图片上传',
          link: common('粘贴图片上传')
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
