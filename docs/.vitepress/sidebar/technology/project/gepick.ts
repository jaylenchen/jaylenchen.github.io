import { DefaultTheme } from "vitepress"
import { item } from "../../../helpers/sidebarItem"

export namespace Gepick {
  export const base = '/technology/project/gepick'
  export const basic = (subPath: string) => `${base}/basic/${subPath.replace(/^\/+/, '')}`
  export const ai = (subPath: string) => `${base}/ai/${subPath.replace(/^\/+/, '')}`

  export const items: DefaultTheme.SidebarItem[] = [
    {
      text: "基础设施搭建",
      collapsed: false,
      items: [
        item(basic('designing-di-framework')),
        item(basic('designing-rpc-protocol')),
        item(basic('designing-ipc-channel')),
        item(basic('design-pattern-review-and-think')),
      ]
    },
    {
      text: '核心生态构建',
      collapsed: false,
      items: [
        item(basic('designing-extensible-cli-system')),
        item(basic('designing-cross-process-logging-system')),
        {
          text: '设计一个可插拔的插件系统'
        },
      ]
    },
    {
      text: 'AI能力集成',
      collapsed: false,
      items: [
        item(ai('designing-chat-session-data-model')),
        item(ai('designing-cross-process-streaming-response-mechanism')),
        item(ai('handling-variable-cycles-in-prompt-engine')),
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