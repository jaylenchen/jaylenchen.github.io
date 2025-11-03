import { DefaultTheme } from "vitepress"

export namespace Thinkto {
    export const base = '/technology/project/thinkto'
    export const items : DefaultTheme.SidebarItem[] = [
        {
            text: '关于我在startup项目中接入CI的经历',
            link: `${base}/关于我在startup项目中接入CI的经历`
        },
        {
            text: '几种图片上传交互处理',
            link: `${base}/几种图片上传交互处理`
        },
    ]
}