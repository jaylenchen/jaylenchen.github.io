import { DefaultTheme } from "vitepress"
import { item } from "../../../helpers/sidebarItem"

export namespace JS {
  export const base = '/technology/common/js'
  export const basic = (subPath: string) => `${base}/${subPath.replace(/^\/+/, '')}`

  export const items: DefaultTheme.SidebarItem[] = [
    item(basic('basic-promise')),
    item(basic('cancellation-token-source')),
    item(basic('cancelable-promise')),
    item(basic('async-programming-patterns')),

  ]
}


