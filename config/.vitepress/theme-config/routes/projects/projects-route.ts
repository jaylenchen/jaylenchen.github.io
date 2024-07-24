import gepick from './gepick'
import thinkto from './thinkto'


export const nav = {
  text: '项目',
  items: [
    gepick.nav,
    thinkto.nav
  ],
}

export const sidebar = {
  ...gepick.sidebar,
  ...thinkto.sidebar
}

export default {
  nav,
  sidebar
}
