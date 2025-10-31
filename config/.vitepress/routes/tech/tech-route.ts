const mermaidItems = [
  {
    text: '使用Mermaid绘制UML类图',
    link: '/tech/mermaid/class-diagrams'
  }
]

const dockerItems = [
  {
    text: 'Docker基本介绍',
    link: '/tech/docker/Docker基本介绍'
  },
  {
    text: 'Docker镜像',
    link: '/tech/docker/Docker镜像'
  },
  {
    text: 'Docker容器',
    link: '/tech/docker/Docker容器'
  },
  {
    text: 'Docker数据卷',
    link: '/tech/docker/Docker数据卷'
  },
  {
    text: 'Docker网络',
    link: '/tech/docker/Docker网络'
  },
  {
    text: 'Docker运行原理',
    link: '/tech/docker/Docker运行原理'
  },
  {
    text: '使用Dockerfile制作镜像',
    link: '/tech/docker/使用Dockerfile制作镜像'
  },
  {
    text: '基于Docker搭建远程开发环境',
    link: '/tech/docker/基于Docker搭建远程开发环境'
  },
  {
    text: '使用开发容器内进行项目开发',
    link: '/tech/docker/使用开发容器内进行项目开发'
  }
]

const rustItems = [
  {
    text: '如何快速学习一个crate',
    link: '/tech/rust/如何快速学习一个crate'
  }
]

const githubItems = [
  {
    text: '探探Github Actions',
    link: '/tech/github/探探Github Actions'
  }
]

const dockerBase = '/tech/docker'
const rustBase = '/tech/rust'
const mermaidBase = '/tech/mermaid'
const githubBase = '/tech/github'

const nav = {
  text: '技术',
  activeMatch: '/tech',
  items: [
    {
      text: 'Docker',
      link: dockerItems[0]?.link ?? `${dockerBase}/`
    },
    {
      text: 'Rust',
      link: rustItems[0]?.link ?? `${rustBase}/`
    },
    {
      text: 'Mermaid',
      link: mermaidItems[0]?.link ?? `${mermaidBase}/`
    },
    {
      text: 'GitHub',
      link: githubItems[0]?.link ?? `${githubBase}/`
    }
  ]
}

const sidebar = {
  [`${dockerBase}/`]: [
    ...dockerItems
  ],
  [`${rustBase}/`]: [
    ...rustItems
  ],
  [`${mermaidBase}/`]: [
    ...mermaidItems
  ],
  [`${githubBase}/`]: [
    ...githubItems
  ]
}

export default {
  nav,
  sidebar
}
