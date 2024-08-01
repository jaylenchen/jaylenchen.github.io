---
title: jaylenchan的随手记
titleTemplate: 首页

layout: home

hero:
  name: jaylenchan的随手记
  text: 探索、研究、分享
  tagline: 探索、研究、分享碎片化、结构化、体系化的技术内容。
  image:
    src: /svgs/avatar.svg
    alt: jaylenchan

# features:
#   - icon: 🚀
#     title: 技术探索
#     details: 深入浅出地探索和分享前端、后端以及全栈开发技术。
#   - icon: 📚
#     title: 学习笔记
#     details: 记录我的学习过程和心得，包括编程语言、框架和工具的使用。

---

<h2>🪧我经历了什么？</h2>
<br />
<img src="/develop.png" alt="Develop"/>

<h2>✨最近在做什么？</h2>
<br/>
<div id="gepick-logo" align="center">
    <br />
    <img src="/svgs/gepick.svg?sanitize=true" alt="Gepick Logo" width="300"/>
    <h1>Gepick</h1>
    <h3>简洁的可视化图形编辑应用</h3>
</div>
<br/>

Gepick是一个可扩展的简洁可视化图形编辑器，如果你对gepick感兴趣，也希望参与到gepick项目中来，可以联系我：

- 📮邮箱：<jaylen.work@hotmail.com>
- 💬微信：let-coding

![img](/projects/gepick/design-page.png)

## 清晰的源码组织结构

![img](/projects/gepick/source-code-organization.png)

### 基于依赖注入实现的清晰的模块架构
![img](/projects/gepick/gepick-main.png)
![img](/projects/gepick/gepick-modules.png)

## 清晰的目录结构

![img](/projects/gepick/gepick-dir.png)

### 根目录主要文件

```shell
.
├── .github # 存放github项目的工程组织相关文件
├── docs # 存放gepick整个项目的相关文档
├── packages # 存放gepick整个项目主要功能的不同组成部分（前端、后端、桌面应用、组件库、编辑器）
├── tools # 存放辅助gepick整个项目开发的工具
```

### .github

```shell
.github
├── ISSUE_TEMPLATE # 项目 issue模板
├── deployment # 项目部署相关文件（dockerfile 、nginx conf）
├── git-branch # 项目的git规范
├── other # 项目其他杂碎文件
└── workflows # github actions，内容包括项目CICD、bug自动化管理、pr自动化管理、npm包自动发布等
```

### docs

```shell
docs
├── build # 构建编译相关的文档
├── editor # 编辑器相关的文档
├── organization # 项目组织相关的文档
├── server # 服务端相关的文档
└── shared # 通用共享工具相关的文档
```

### packages

```shell
packages
├── editor # 编辑器
├── electron # 桌面应用
├── graphql # graphql文件
├── server # 服务端
├── shared # 通用工具
├── ui # 组件库
└── workbench # 前端
```

### tools

```shell
tools
├── cli-rs # rust编写的脚手架
├── cli-ts # typescript编写的脚手架
└── utils # tools公用的工具
```
