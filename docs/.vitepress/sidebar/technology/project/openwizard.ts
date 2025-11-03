import { DefaultTheme } from "vitepress"

export namespace Openwizard {
    export const base = '/technology/project/openwizard'
export const wizard = (subPath: string) => `${base}/wizard-transpiler/${subPath.replace(/^\/+/, '')}`
    export const mobile = (subPath: string) => `${base}/mobile/${subPath.replace(/^\/+/, '')}`

    export const items : DefaultTheme.SidebarItem[] = [
        {
            text: '移动应用微信登录功能接入',
            link: mobile('移动应用微信登录功能接入')
        },
        {
            text: 'wizard缩进语法实现',
            link: wizard('wizard缩进语法实现')
        }
    ]
}