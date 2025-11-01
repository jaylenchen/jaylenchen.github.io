import { DefaultTheme } from 'vitepress'

const githubBase = '/technology/common/github'

const items: DefaultTheme.SidebarItem[] = [
  {
    text: '探探Github Actions',
    link: `${githubBase}/探探Github Actions`
  }
]

export const nav = {
  text: 'GitHub',
  link: githubBase,
  activeMatch: '^/technology/common/github'
}

export const sidebar: DefaultTheme.Config['sidebar'] = {
  [githubBase]: [...items]
}

export default {
  nav,
  sidebar
}

