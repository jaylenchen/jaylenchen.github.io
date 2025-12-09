import { DefaultTheme } from "vitepress"
import { item } from "../../../helpers/sidebarItem"

export namespace Mermaid {
    export const base = '/technology/common/mermaid'
    export const basic = (subPath: string) => `${base}/${subPath.replace(/^\/+/, '')}`
    
    export const items : DefaultTheme.SidebarItem[] = [
        item(basic('class-diagrams'))
    ]
}   