import { DefaultTheme } from "vitepress"

export namespace Gepick {
    export const base = '/technology/project/gepick'
    export const basic = (subPath: string) => `${base}/basic/${subPath.replace(/^\/+/, '')}`
    export const ai = (subPath: string) => `${base}/ai/${subPath.replace(/^\/+/, '')}`

    export const items : DefaultTheme.SidebarItem[] = [
        {
            text: '基础能力',
            collapsed: false,
            items: [
                {
                  text: '基于InversifyJS的服务基础框架',
                  link: basic('di-framework')
                },
                {
                  text: '如何设计一个可扩展的CLI系统',
                  link: basic('cli-system')
                },
                {
                  text: 'RPC协议的设计与实现概述',
                  link: basic('rpc-protocol')
                },
                {
                  text: 'IPCChannel的设计与实现',
                  link: basic('ipc-channel')
                },
                {
                  text: '关于设计模式应用的回顾与思考',
                  link: basic('design-pattern-review-and-think')
                },
                {
                  text: '设计一个与VSCode类似的插件系统'
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