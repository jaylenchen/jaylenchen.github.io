import { DefaultTheme } from "vitepress"
import { item } from "../../../helpers/sidebarItem"

export namespace Docker {
    export const base = '/technology/common/docker'
    export const basic = (subPath: string) => `${base}/${subPath.replace(/^\/+/, '')}`
    
    export const items : DefaultTheme.SidebarItem[] = [
        item(basic('Docker基本介绍')),
        item(basic('Docker镜像')),
        item(basic('Docker容器')),
        item(basic('Docker数据卷')),
        item(basic('Docker网络')),
        item(basic('Docker运行原理')),
        item(basic('使用Dockerfile制作镜像')),
        item(basic('基于Docker搭建远程开发环境')),
        item(basic('使用开发容器内进行项目开发'))
    ]
}

