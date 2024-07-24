import gepick from './gepick'
import thinkto from './thinkto'
import tsalg from './tsalg'


export const nav = {
  text: '项目',
  items: [
    gepick.nav,
    thinkto.nav,
    tsalg.nav
  ],
}

export const sidebar = {
  ...gepick.sidebar,
  ...thinkto.sidebar,
  ...tsalg.sidebar
}

export default {
  nav,
  sidebar
}
