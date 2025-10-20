import type { DefaultTheme } from 'vitepress';
import life from "./life/life-route"
import tech from "./tech/tech-route"
import projects from './projects/projects-route'
import tag from './tag/tag-route'
import archives from './archives/archives-route'
import gepick from './projects/gepick';

export const nav: DefaultTheme.Config['nav'] = [
  gepick.nav,
  projects.nav,
  tech.nav,
  life.nav,
  tag.nav,
  archives.nav
];

export const sidebar: DefaultTheme.Config['sidebar'] = {
  ...life.sidebar,
  ...tech.sidebar,
  ...projects.sidebar,
}
