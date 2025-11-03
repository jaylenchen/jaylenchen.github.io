import { DefaultTheme } from "vitepress"

export namespace Rust {
    export const base = '/technology/common/rust'
    export const items : DefaultTheme.SidebarItem[] = [
        {
            text: '如何快速学习一个crate',
            link: `${base}/如何快速学习一个crate`
        },
        {
            text: '使用nom_combinator',
            link: `${base}/使用nom_combinator`
        },
        {
            text: '使用nom_multi',
            link: `${base}/使用nom_multi`
        },
        {
            text: '使用nom_sequence',
            link: `${base}/使用nom_sequence`
        },
        {
            text: '使用nom_branch',
            link: `${base}/使用nom_branch`
        }
    ]
}