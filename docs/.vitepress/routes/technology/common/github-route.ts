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
  link: items[0]?.link ?? `${githubBase}/`
}

export const sidebar: DefaultTheme.Config['sidebar'] = {
  [`${githubBase}/`]: [...items]
}

export default {
  nav,
  sidebar
}

