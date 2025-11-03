import { DefaultTheme } from "vitepress"
import { item } from "../../../helpers/sidebarItem"

export namespace Gepick {
    export const base = '/technology/project/gepick'
    export const basic = (subPath: string) => `${base}/basic/${subPath.replace(/^\/+/, '')}`
    export const ai = (subPath: string) => `${base}/ai/${subPath.replace(/^\/+/, '')}`

    export const items : DefaultTheme.SidebarItem[] = [
        {
            text: '基础能力',
            collapsed: false,
            items: [
                item(basic('di-framework')),
                item(basic('cli-system')),
                item(basic('rpc-protocol')),
                item(basic('ipc-channel')),
                item(basic('design-pattern-review-and-think')),
                {
                  text: '如何设计一个与VSCode类似的插件系统'
                }
              ]
          },
          {
            text: 'AI 能力',
            collapsed: false,
            items: [
                {
                  text: '跨进程流式响应机制设计'
                },
                {
                  text: 'Agent框架之Prompt模板引擎的设计与实现'
                },
                {
                  text: 'Agent框架之Function Tools的设计与实现'
                },
                {
                  text: 'Agent框架之Agent的设计与实现'
                },
                {
                  text: 'Agent框架之MCP机制的集成与实现'
                }
              ]
          }
    ]
}