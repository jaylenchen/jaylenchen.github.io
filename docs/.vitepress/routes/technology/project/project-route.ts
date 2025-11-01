import thinkto from './thinkto-route'
import openwizard from './openwizard-route'
import gepick from './gepick-route'
// import tsalg from './tsalg-route'


export const projectNavItems = [
  gepick.nav,
  openwizard.nav,
  thinkto.nav,
  // tsalg.nav
]

export const nav = {
  text: '项目',
  items: projectNavItems,
}

export const sidebar = {
  ...gepick.sidebar,
  ...openwizard.sidebar,
  ...thinkto.sidebar,
  // ...tsalg.sidebar
}

export default {
  nav,
  sidebar
}
