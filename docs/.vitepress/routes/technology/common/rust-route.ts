import { DefaultTheme } from 'vitepress'

const rustBase = '/technology/common/rust'

const items: DefaultTheme.SidebarItem[] = [
  {
    text: '如何快速学习一个crate',
    link: `${rustBase}/如何快速学习一个crate`
  }
]

export const nav = {
  text: 'Rust',
  link: items[0]?.link ?? `${rustBase}/`
}

export const sidebar: DefaultTheme.Config['sidebar'] = {
  [`${rustBase}/`]: [...items]
}

export default {
  nav,
  sidebar
}

