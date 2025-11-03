import { DefaultTheme } from "vitepress"

export namespace Life {
    export const base = '/life'
    export const items : DefaultTheme.SidebarItem[] = [
        {
            text: 'GTD时间管理',
            link: `${base}/GTD时间管理`
        }
    ]
}