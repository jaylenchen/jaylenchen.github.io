import { DefaultTheme } from "vitepress"

export namespace Docker {
    export const base = '/technology/common/docker'
    export const items : DefaultTheme.SidebarItem[] = [
        {
          text: 'Docker基本介绍',
          link: `${base}/Docker基本介绍`
        },
        {
          text: 'Docker镜像',
          link: `${base}/Docker镜像`
        },
        {
          text: 'Docker容器',
          link: `${base}/Docker容器`
        },
        {
          text: 'Docker数据卷',
          link: `${base}/Docker数据卷`
        },
        {
          text: 'Docker网络',
          link: `${base}/Docker网络`
        },
        {
          text: 'Docker运行原理',
          link: `${base}/Docker运行原理`
        },
        {
          text: '使用Dockerfile制作镜像',
          link: `${base}/使用Dockerfile制作镜像`
        },
        {
          text: '基于Docker搭建远程开发环境',
          link: `${base}/基于Docker搭建远程开发环境`
        },
        {
          text: '使用开发容器内进行项目开发',
          link: `${base}/使用开发容器内进行项目开发`
        }
    ]
}

