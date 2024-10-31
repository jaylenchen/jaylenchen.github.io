const nav = {
  text: '技术',
  link: '/tech/docker/Docker基本介绍',
  activeMatch: '/tech'
}

const sidebar = {
  "/tech": [
    // ==========Docker系列==========
    {
      text: 'Docker系列',
      items: [
        {
          text: "Docker基本介绍",
          link: "/tech/docker/Docker基本介绍"
        },
        {
          text: "Docker镜像",
          link: "/tech/docker/Docker镜像"
        },
        {
          text: "Docker容器",
          link: "/tech/docker/Docker容器"
        },
        {
          text: "Docker数据卷",
          link: "/tech/docker/Docker数据卷"
        },
        {
          text: "Docker网络",
          link: "/tech/docker/Docker网络"
        },
        {
          text: "Docker运行原理",
          link: "/tech/docker/Docker运行原理"
        },
        {
          text: "使用Dockerfile制作镜像",
          link: "/tech/docker/使用Dockerfile制作镜像"
        },
        {
          text: "基于Docker搭建远程开发环境",
          link: "/tech/docker/基于Docker搭建远程开发环境"
        },
        {
          text: "使用开发容器内进行项目开发",
          link: "/tech/docker/使用开发容器内进行项目开发"
        },
      ],
      collapsed: true
    },
    // ==========Rust系列==========
    {
      text: 'Rust系列',
      items: [
        {
          text: "如何快速学习一个crate",
          link: "/tech/rust/如何快速学习一个crate"
        },
      ],
      collapsed: true
    },
    // ==========Github系列==========
    {
      text: 'Github系列',
      items: [
        {
          text: "探探Github Actions",
          link: "/tech/github/探探Github Actions"
        },
      ],
      collapsed: true
    },
  ],
}

export default {
  nav,
  sidebar
}
