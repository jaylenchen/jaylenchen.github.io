import type { DefaultTheme } from 'vitepress';
import about from './about/about-route'
import life from './life/life-route'
import technology from './technology/technology-route'
import tag from './tag/tag-route'

export const nav: DefaultTheme.Config['nav'] = [
  about.nav,
  technology.nav,
  life.nav,
  tag.nav,
];

export const sidebar: DefaultTheme.Config['sidebar'] = {
  ...life.sidebar,
  ...technology.sidebar,
}
