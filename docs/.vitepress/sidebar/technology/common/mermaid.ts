import { DefaultTheme } from "vitepress"

export namespace Mermaid {
    export const base = '/technology/common/mermaid'
    export const items : DefaultTheme.SidebarItem[] = [
        {
            text: '使用Mermaid绘制UML类图',
            link: `${base}/class-diagrams`
        }
    ]
}   