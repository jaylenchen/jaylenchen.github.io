import type { DefaultTheme } from 'vitepress'
import { getH1TitleForLink } from './extractTitle'

export function item(link: string): DefaultTheme.SidebarItem {
  const text = getH1TitleForLink(link) || link
  return { text, link }
}


