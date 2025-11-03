import { DefaultTheme } from "vitepress"
import { item } from "../../../helpers/sidebarItem"

export namespace Thinkto {
    export const base = '/technology/project/thinkto'
    export const items : DefaultTheme.SidebarItem[] = [
        item(`${base}/关于我在startup项目中接入CI的经历`),
        item(`${base}/几种图片上传交互处理`),
    ]
}