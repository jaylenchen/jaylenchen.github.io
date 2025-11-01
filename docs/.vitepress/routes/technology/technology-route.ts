import { projectNavItems, sidebar as projectSidebar, nav as projectNav } from './project/project-route'
import { commonNavItems, commonSidebar } from './common/common-route'

export const nav = {
  text: '技术',
  activeMatch: '/technology/',
  items: [
    {
      text: projectNav.text,
      items: projectNavItems
    },
    {
      text: '通用',
      items: commonNavItems
    }
  ]
}

export const sidebar = {
  ...projectSidebar,
  ...commonSidebar
}

export default {
  nav,
  sidebar
}
