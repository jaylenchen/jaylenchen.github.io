import { DefaultTheme } from "vitepress"
import { item } from "../../../helpers/sidebarItem"

export namespace Rust {
    export const base = '/technology/common/rust'
    export const basic = (subPath: string) => `${base}/${subPath.replace(/^\/+/, '')}`
    
    export const items : DefaultTheme.SidebarItem[] = [
        item(basic('如何快速学习一个crate')),
        item(basic('使用nom_combinator')),
        item(basic('使用nom_multi')),
        item(basic('使用nom_sequence')),
        item(basic('使用nom_branch'))
    ]
}