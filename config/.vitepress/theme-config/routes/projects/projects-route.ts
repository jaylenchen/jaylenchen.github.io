import gepick from './gepick'


export const nav = {
  text: '项目',
  items: [
    gepick.nav
  ],
}

export const sidebar = {
  ...gepick.sidebar
}

export default {
  nav,
  sidebar
}
