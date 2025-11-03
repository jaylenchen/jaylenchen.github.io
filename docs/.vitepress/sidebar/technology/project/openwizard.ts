import { DefaultTheme } from "vitepress"
import { item } from "../../../helpers/sidebarItem"

export namespace Openwizard {
    export const base = '/technology/project/openwizard'
export const wizard = (subPath: string) => `${base}/wizard-transpiler/${subPath.replace(/^\/+/, '')}`
    export const mobile = (subPath: string) => `${base}/mobile/${subPath.replace(/^\/+/, '')}`

    export const items : DefaultTheme.SidebarItem[] = [
        item(mobile('移动应用微信登录功能接入')),
        item(wizard('wizard缩进语法实现'))
    ]
}