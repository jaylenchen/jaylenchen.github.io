import { DefaultTheme } from "vitepress"
import { item } from "../../helpers/sidebarItem"

export namespace Life {
    export const base = '/life'
    export const items : DefaultTheme.SidebarItem[] = [
        item(`${base}/GTD时间管理`)
    ]
}