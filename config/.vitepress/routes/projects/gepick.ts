import { DefaultTheme } from 'vitepress';

const gepick = (subPath: string) => '/projects/gepick' + subPath


const core = (subPath: string) => gepick('/core/' + subPath)
const organizationSidebar = {
  text: '@gepick/core',
  items: [
    {
      text: "基于InversifyJS的服务基础框架",
      link: core("di-framework")
    },
    {
      text: "设计一个可扩展的CLI系统",
      link: core("cli-system")
    },
  ],
  collapsed: true
}



const nav = { 
  text: 'gepick', link: core("di-framework") ,
}

const sidebar: DefaultTheme.Config['sidebar'] = {
  [gepick('/')]: [
    organizationSidebar,
   
  ]
}

export default {
  nav,
  sidebar
}
