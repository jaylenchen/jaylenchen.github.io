import { DefaultTheme } from "vitepress"

export namespace Github {
    export const base = '/technology/common/github'
    export const items : DefaultTheme.SidebarItem[] = [
        {
            text: '探探Github Actions',
            link: `${base}/探探Github Actions`
        }
    ]
}