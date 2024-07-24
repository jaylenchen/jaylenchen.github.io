import type { DefaultTheme } from 'vitepress';
import common from './common/common-route'
import projects from './projects/projects-route'
import tag from './tag/tag-route'
import archives from './archives/archives-route'

export const nav: DefaultTheme.Config['nav'] = [
  common.nav,
  projects.nav,
  tag.nav,
  archives.nav
];

export const sidebar: DefaultTheme.Config['sidebar'] = {
  ...common.sidebar,
  ...projects.sidebar
}
