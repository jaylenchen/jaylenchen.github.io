import { DefaultTheme } from 'vitepress';

const gepick = (subPath: string) => '/projects/gepick' + subPath

// =====项目组织=====
enum Organization {
  聊聊插件化系统设计 = '聊聊插件化系统设计'
}
const organization = (subPath: string) => gepick('/organization/' + subPath)
const organizationSidebar = {
  text: '项目组织',
  items: [
    {
      text: Organization.聊聊插件化系统设计,
      link: organization(Organization.聊聊插件化系统设计)
    },
  ],
  collapsed: true
}

// =====桌面端=====
enum Desktop {
  进程间通信方案设计 = '进程间通信方案设计'
}
const desktop = (subPath: string) => gepick('/desktop/' + subPath)
const desktopSidebar = {
  text: '桌面端',
  items: [
    // {
    //   text: Desktop.进程间通信方案设计,
    //   link: desktop(Desktop.进程间通信方案设计)
    // },
  ],
  collapsed: true
}


// =====编辑器=====
enum Editor {
}
const editor = (subPath: string) => gepick('/editor/' + subPath)
const editorSidebar = {
  text: '编辑器',
  items: [
    // {
    //   text: Desktop.进程间通信方案设计,
    //   link: desktop(Desktop.进程间通信方案设计)
    // },
  ],
  collapsed: true
}

const nav = { text: 'gepick', link: organization(Organization.聊聊插件化系统设计) }

const sidebar: DefaultTheme.Config['sidebar'] = {
  [gepick('/')]: [
    organizationSidebar,
    desktopSidebar,
    editorSidebar
  ]
}

export default {
  nav,
  sidebar
}
