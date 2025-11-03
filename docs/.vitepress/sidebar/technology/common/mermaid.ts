import { DefaultTheme } from "vitepress"
import { item } from "../../../helpers/sidebarItem"

export namespace Mermaid {
    export const base = '/technology/common/mermaid'
    export const items : DefaultTheme.SidebarItem[] = [
        item(`${base}/class-diagrams`)
    ]
}   