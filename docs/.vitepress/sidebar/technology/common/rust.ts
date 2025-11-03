import { DefaultTheme } from "vitepress"
import { item } from "../../../helpers/sidebarItem"

export namespace Rust {
    export const base = '/technology/common/rust'
    export const items : DefaultTheme.SidebarItem[] = [
        item(`${base}/如何快速学习一个crate`),
        item(`${base}/使用nom_combinator`),
        item(`${base}/使用nom_multi`),
        item(`${base}/使用nom_sequence`),
        item(`${base}/使用nom_branch`)
    ]
}