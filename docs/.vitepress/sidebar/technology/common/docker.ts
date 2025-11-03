import { DefaultTheme } from "vitepress"
import { item } from "../../../helpers/sidebarItem"

export namespace Docker {
    export const base = '/technology/common/docker'
    export const items : DefaultTheme.SidebarItem[] = [
        item(`${base}/Docker基本介绍`),
        item(`${base}/Docker镜像`),
        item(`${base}/Docker容器`),
        item(`${base}/Docker数据卷`),
        item(`${base}/Docker网络`),
        item(`${base}/Docker运行原理`),
        item(`${base}/使用Dockerfile制作镜像`),
        item(`${base}/基于Docker搭建远程开发环境`),
        item(`${base}/使用开发容器内进行项目开发`)
    ]
}

