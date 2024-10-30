import type { DefaultTheme } from 'vitepress';
import life from "./life/life-route"
import projects from './projects/projects-route'
import tag from './tag/tag-route'
import archives from './archives/archives-route'

export const nav: DefaultTheme.Config['nav'] = [
  life.nav,
  projects.nav,
  tag.nav,
  archives.nav
];

export const sidebar: DefaultTheme.Config['sidebar'] = {
  ...life.sidebar,
  ...projects.sidebar,

}
