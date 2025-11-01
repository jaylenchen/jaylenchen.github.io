import type { DefaultTheme } from 'vitepress';
import about from './about/about-route'
import life from "./life/life-route"
import tech from "./tech/tech-route"
import projects from './projects/projects-route'
import tag from './tag/tag-route'

export const nav: DefaultTheme.Config['nav'] = [
  about.nav,
  tag.nav,
  projects.nav,
  tech.nav,
  life.nav,
];

export const sidebar: DefaultTheme.Config['sidebar'] = {
  ...life.sidebar,
  ...tech.sidebar,
  ...projects.sidebar,
}
