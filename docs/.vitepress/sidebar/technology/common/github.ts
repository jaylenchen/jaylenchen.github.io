import { DefaultTheme } from "vitepress"
import { item } from "../../../helpers/sidebarItem"

export namespace Github {
    export const base = '/technology/common/github'
    export const basic = (subPath: string) => `${base}/${subPath.replace(/^\/+/, '')}`
    
    export const items : DefaultTheme.SidebarItem[] = [
        item(basic('探探Github Actions'))
    ]
}