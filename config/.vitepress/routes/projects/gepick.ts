import { DefaultTheme } from 'vitepress';

const gepick = (subPath: string) => '/projects/gepick' + subPath


const core = (subPath: string) => gepick('/core/' + subPath)
const organizationSidebar = {
  text: '@gepick/core',
  items: [
    {
      text: "CLI System Design",
      link: core("cli-system")
    },
  ],
  collapsed: true
}



const nav = { text: 'gepick', link: core("cli-system") }

const sidebar: DefaultTheme.Config['sidebar'] = {
  [gepick('/')]: [
    organizationSidebar,
   
  ]
}

export default {
  nav,
  sidebar
}
