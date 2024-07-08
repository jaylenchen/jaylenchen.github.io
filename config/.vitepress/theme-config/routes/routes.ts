import type { DefaultTheme } from 'vitepress';
import { gepickNav, gepickSidebar } from './gepick'

export const nav: DefaultTheme.Config['nav'] = [
  {
    text: '项目',
    items: [
      gepickNav
    ],
  },
  {
    text: '标签',
    link: '/tags',
    activeMatch: '/tags'
  },
  {
    text: '归档',
    link: '/archives',
    activeMatch: '/archives'
  },
];

export const sidebar: DefaultTheme.Config['sidebar'] = {
  ...gepickSidebar
}
