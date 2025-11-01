import { DefaultTheme } from 'vitepress'

const dockerBase = '/technology/common/docker'

const items: DefaultTheme.SidebarItem[] = [
  {
    text: 'Docker基本介绍',
    link: `${dockerBase}/Docker基本介绍`
  },
  {
    text: 'Docker镜像',
    link: `${dockerBase}/Docker镜像`
  },
  {
    text: 'Docker容器',
    link: `${dockerBase}/Docker容器`
  },
  {
    text: 'Docker数据卷',
    link: `${dockerBase}/Docker数据卷`
  },
  {
    text: 'Docker网络',
    link: `${dockerBase}/Docker网络`
  },
  {
    text: 'Docker运行原理',
    link: `${dockerBase}/Docker运行原理`
  },
  {
    text: '使用Dockerfile制作镜像',
    link: `${dockerBase}/使用Dockerfile制作镜像`
  },
  {
    text: '基于Docker搭建远程开发环境',
    link: `${dockerBase}/基于Docker搭建远程开发环境`
  },
  {
    text: '使用开发容器内进行项目开发',
    link: `${dockerBase}/使用开发容器内进行项目开发`
  }
]

export const nav = {
  text: 'Docker',
  link: items[0]?.link ?? `${dockerBase}/`
}

export const sidebar: DefaultTheme.Config['sidebar'] = {
  [`${dockerBase}/`]: [...items]
}

export default {
  nav,
  sidebar
}

