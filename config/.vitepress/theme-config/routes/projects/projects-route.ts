import thinkto from './thinkto'
import openwizard from './openwizard'
import gepick from './gepick'
import tsalg from './tsalg'


export const nav = {
  text: '项目',
  items: [
    gepick.nav,
    openwizard.nav,
    thinkto.nav,
    tsalg.nav
  ],
}

export const sidebar = {
  ...gepick.sidebar,
  ...openwizard.sidebar,
  ...thinkto.sidebar,
  ...tsalg.sidebar
}

export default {
  nav,
  sidebar
}
