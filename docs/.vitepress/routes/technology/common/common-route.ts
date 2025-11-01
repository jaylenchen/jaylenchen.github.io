import docker from './docker-route'
import rust from './rust-route'
import mermaid from './mermaid-route'
import github from './github-route'

export const commonNavItems = [
  docker.nav,
  rust.nav,
  mermaid.nav,
  github.nav
]

export const commonSidebar = {
  ...docker.sidebar,
  ...rust.sidebar,
  ...mermaid.sidebar,
  ...github.sidebar
}

export default {
  navItems: commonNavItems,
  sidebar: commonSidebar
}

