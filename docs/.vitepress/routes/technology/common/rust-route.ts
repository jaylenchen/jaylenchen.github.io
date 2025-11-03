import { DefaultTheme } from 'vitepress'

const rustBase = '/technology/common/rust'

const items: DefaultTheme.SidebarItem[] = [
  {
    text: '如何快速学习一个crate',
    link: `${rustBase}/如何快速学习一个crate`
  },
  {
    text: '使用nom_combinator',
    link: `${rustBase}/使用nom_combinator`
  },
  {
    text: '使用nom_multi',
    link: `${rustBase}/使用nom_multi`
  },
  {
    text: '使用nom_sequence',
    link: `${rustBase}/使用nom_sequence`
  },
  {
    text: '使用nom_branch',
    link: `${rustBase}/使用nom_branch`
  }
]

export const nav = {
  text: 'Rust',
  link: rustBase,
  activeMatch: '^/technology/common/rust'
}

export const sidebar: DefaultTheme.Config['sidebar'] = {
  [rustBase]: [...items]
}

export default {
  nav,
  sidebar
}

