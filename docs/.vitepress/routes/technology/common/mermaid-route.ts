import { DefaultTheme } from 'vitepress'

const mermaidBase = '/technology/common/mermaid'

const items: DefaultTheme.SidebarItem[] = [
  {
    text: '使用Mermaid绘制UML类图',
    link: `${mermaidBase}/class-diagrams`
  }
]

export const nav = {
  text: 'Mermaid',
  link: items[0]?.link ?? `${mermaidBase}/`
}

export const sidebar: DefaultTheme.Config['sidebar'] = {
  [`${mermaidBase}/`]: [...items]
}

export default {
  nav,
  sidebar
}

