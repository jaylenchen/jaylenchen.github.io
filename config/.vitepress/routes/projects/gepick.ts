import { DefaultTheme } from 'vitepress';

const gepick = (subPath: string) => '/projects/gepick' + subPath


const basic = (subPath: string) => gepick('/basic/' + subPath)


const nav = { 
  text: 'gepick', link: basic("di-framework") ,
}

const sidebar: DefaultTheme.Config['sidebar'] = {
  [gepick('/')]: [
    {
      text: '基础核心',
      items: [
        {
          text: "基于InversifyJS的服务基础框架",
          link: basic("di-framework")
        },
        {
          text: "设计一个可扩展的CLI系统",
          link: basic("cli-system")
        },
        {
          text: "RPC协议的设计与实现概述",
          link: basic("rpc-protocol")
        },
        {
          text: "IPCChannel的设计与实现",
          link: basic("ipc-channel")
        },
        {
          text: "关于设计模式应用的回顾与思考",
          link: basic("design-pattern-review-and-think")
        },
        {
          text: "设计一个与VSCode类似的插件系统"
        }
      ],
      collapsed: true
    },
    {
      text: 'AI系统',
      items: [
        {
          text: "跨进程流式响应机制设计",
          // link: basic("design-pattern-review-and-think")
        },
        {
          text: "Agent框架之Prompt模板引擎的设计与实现"
        },
        {
          text: "Agent框架之Function Tools的设计与实现"
        },
        {
          text: "Agent框架之Agent的设计与实现"
        },
        {
          text: "Agent框架之MCP机制的集成与实现"
        }
      ],
      collapsed: true
    },
   
  ]
}

export default {
  nav,
  sidebar
}
