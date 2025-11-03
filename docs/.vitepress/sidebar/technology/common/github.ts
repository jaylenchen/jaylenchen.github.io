import { DefaultTheme } from "vitepress"
import { item } from "../../../helpers/sidebarItem"

export namespace Github {
    export const base = '/technology/common/github'
    export const items : DefaultTheme.SidebarItem[] = [
        item(`${base}/探探Github Actions`)
    ]
}