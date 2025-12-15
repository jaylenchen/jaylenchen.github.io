import { DefaultTheme } from "vitepress"
import { item } from "../../../helpers/sidebarItem"

export namespace JS {
  export const base = '/technology/common/js'
  export const async = (subPath: string) => `${base}/async/${subPath.replace(/^\/+/, '')}`
  export const browser = (subPath: string) => `${base}/browser/${subPath.replace(/^\/+/, '')}`


  export const items: DefaultTheme.SidebarItem[] = [
    {
      text: "异步编程",
      collapsed: false,
      items: [
        item(async('basic-promise')),
        item(async('cancellation-token-source')),
        item(async('cancelable-promise')),
        item(async('creating-data-stream-approaches')),
      ]
    },
    {
      text: "渲染交互",
      collapsed: false,
      items: [
        item(browser('image-upload')),
      ]
    },
    {
      text: "服务交互",
      collapsed: false,
      items: []
    }
  ]
}


