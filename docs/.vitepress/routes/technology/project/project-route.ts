import thinkto from './thinkto-route'
import openwizard from './openwizard-route'
import gepick from './gepick-route'


export const projectNavItems = [
  gepick.nav,
  openwizard.nav,
  thinkto.nav,
]

export const nav = {
  text: '项目',
  items: projectNavItems,
}

export const sidebar = {
  ...gepick.sidebar,
  ...openwizard.sidebar,
  ...thinkto.sidebar,
}

export default {
  nav,
  sidebar
}
