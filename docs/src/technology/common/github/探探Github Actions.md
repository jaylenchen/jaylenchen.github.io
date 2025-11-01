---
publish: true
date: 2024/06/05 18:00
title: 探探Github Actions
project: 通用技术
tags:
- github
- cicd
---

# 探探Github Actions

![img](/technology/common/github/github-actions1.jpeg)

GitHub Actions 是一个持续集成和持续交付（CI/CD）平台，它允许你**自动化你的构建、测试和部署流程**。你可以创建工作流，对你的仓库中的每个拉取请求进行构建和测试，或者将合并的拉取请求部署到生产环境。

GitHub Actions 不仅仅用于 DevOps，它还可以在你的仓库中发生其他事件时运行工作流。例如，每当有人在你的仓库中创建新的问题时，你可以运行一个工作流来自动添加适当的标签。

GitHub 提供 Linux、Windows 和 macOS 虚拟机来运行你的工作流，或者你可以在你自己的数据中心或云基础设施中托管你自己的自托管运行器。

## GitHub Actions 的组成成分

![img](/technology/common/github/github-actions2.webp)

你可以配置一个 GitHub Actions 工作流在你的仓库中发生事件时触发，例如打开一个 pull request 或创建一个 issue。你的工作流包含一个或多个可以按顺序或并行运行的工作。每个工作将在其自己的虚拟机运行器内运行，或者在一个容器内运行，并且有一个或多个步骤，这些步骤可以运行你定义的脚本，或者运行一个动作，这是一个可重用的扩展，可以简化你的工作流。

### 工作流（Workflows）

工作流（Workflows）**是一个可配置的自动化过程，将运行一个或多个任务**。工作流由存储在你的仓库中的 YAML 文件定义，并且当你的仓库中发生事件时会运行，或者它们可以被手动触发，或者在定义的时间表上触发。

工作流在仓库的 .github/workflows 目录中定义，一个仓库可以有多个工作流（Workflows），每个工作流（Workflows）可以执行一组不同的任务。例如，你可以有一个工作流（Workflow）来构建和测试 pull 请求，另一个工作流（Workflow）在每次创建发布时部署你的应用程序，还有另一个工作流（Workflow）在每次有人打开新问题时添加标签。

更多地，你还可以在另一个工作流中引用一个工作流。参考[Reusing workflows](https://docs.github.com/en/actions/using-workflows/reusing-workflows)

### 事件（Events）

事件（Events）**是仓库中的特定活动，触发工作流（Workflows）运行**。例如，当有人在github上创建 pull 请求、打开问题，或者向仓库推送提交时，这些活动都可以触发工作流（Workflows）运行。你也可以按照时间表触发工作流（Workflows）运行，通过发布到 REST API，或者手动触发。

### 任务（Jobs）

任务（Jobs）**是在同一运行器上执行的工作流（Workflows）中的一组步骤**。每个步骤要么是将要执行的 shell 脚本（Script），要么是将要运行的动作（Action）。步骤按顺序执行，并且彼此依赖。由于每个步骤都在同一运行器上执行，你可以从一个步骤分享数据到另一个步骤。例如，你可以有一个构建你的应用程序的步骤，然后是测试构建的应用程序的步骤。

你可以配置任务（Jobs）与其他任务（Jobs）的依赖关系；默认情况下，任务没有依赖关系并且彼此并行运行。当一个任务依赖于另一个任务时，它将等待依赖的任务完成后才能运行。例如，你可能有多个针对不同架构的构建任务，这些任务没有依赖关系，以及一个依赖于这些任务的打包任务。构建任务将并行运行，当它们全部成功完成后，打包任务将运行。

### 动作（Actions）

动作（Actions）**是 GitHub Actions 平台的自定义应用**，用于执行复杂但频繁重复的任务。使用动作（Actions）可以**帮助减少你在工作流文件中编写的重复代码量**。动作可以从 GitHub 拉取你的 git 仓库，为你的构建环境设置正确的工具链，或者为你的云提供商设置认证。

### 运行环境（runners）

运行环境**是一个虚拟服务器，当工作流被触发时，它会运行你的工作流**。每个运行环境一次可以运行一个任务。**GitHub 提供 Ubuntu Linux、Microsoft Windows 和 macOS 三种运行环境来运行你的工作流**；每个工作流运行都在一个新的、新配置的虚拟机中执行。GitHub 还提供更大的运行环境，这些运行环境有更大的配置可供选择

### Workflow示例

```yaml
# 可选 - 工作流的名称，它将出现在 GitHub 仓库的 "Actions" 标签中。如果省略了这个字段，将使用工作流文件的名称。
name: learn-github-actions

# 可选 - 从工作流生成的工作流运行的名称，将出现在你的仓库的 "Actions" 标签上的工作流运行列表中。这个例子使用了一个带有 github 上下文的表达式，以显示触发工作流运行的操作者的用户名。更多信息，请参阅 "AUTOTITLE"。
run-name: ${{ github.actor }} is learning GitHub Actions

# 指定此工作流的触发器。这个例子使用了 push 事件，所以每次有人向仓库推送更改或合并 pull 请求时，都会触发一个工作流运行。这是由推送到每个分支触发的；对于只在推送到特定分支、路径或标签时运行的语法示例，请参见 "AUTOTITLE"。
on: [push]

# 将在 learn-github-actions 工作流中运行的所有任务组合在一起。
jobs:

  # 定义了一个名为 check-bats-version 的任务。子键将定义任务的属性。
  check-bats-version:

    # 配置任务在最新版本的 Ubuntu Linux 运行器上运行。这意味着任务将在 GitHub 托管的一个新的虚拟机上执行。关于使用其他运行器的语法示例，请参见 "AUTOTITLE"
    runs-on: ubuntu-latest

    # 将在 check-bats-version 任务中运行的所有步骤组合在一起。在这个部分下面嵌套的每个项目都是一个单独的动作或 shell 脚本。
    steps:

      # uses 关键字指定这个步骤将运行 actions/checkout 动作的 v4 版本。这是一个将你的仓库检出到运行器的动作，允许你对你的代码运行脚本或其他动作（如构建和测试工具）。任何时候你的工作流将使用仓库的代码，你都应该使用检出动作。
      - uses: actions/checkout@v4

      # 这个步骤使用 actions/setup-node@v4 动作来安装指定版本的 Node.js。（这个例子使用的是版本 20。）这将 node 和 npm 命令放入你的 PATH 中。
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      # run 关键字告诉任务在运行器上执行一个命令。在这种情况下，你正在使用 npm 安装 bats 软件测试包。
      - run: npm install -g bats

      # 最后，你将运行 bats 命令，并带有一个输出软件版本的参数。
      - run: bats -v
```

![img](/technology/common/github/github-actions2.webp)

## 常用events

```yaml
on:
  issue_comment:
    types: [created, deleted]
```

## 手动触发Workflows

为了节省Github Actions资源，不需要每次推送自动触发workflows，我们可以将event设置成`workflow_dispatch` 就能够取消自动触发，而变成在github上允许我们手动触发相关workflow。

## Github Action落地场景

- 发布一个npm包
- 构建一个app镜像

## 总结

简而言之，Github Actions提供了Workflows让开发者们可以在“**什么事情发生（on[event]）**”的时候“**做一些什么事(jobs)**”

## 参考

- 文章
  - [Understanding GitHub Actions - GitHub Docs](https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions)

  - [Manually running a workflow - GitHub Docs](https://docs.github.com/en/actions/using-workflows/manually-running-a-workflow)

  - [Github Actions Reusable Workflow](https://theviper.world/posts/github-actions-reusable-workflow/)

  - [GitHub Actions 入门教程 - 阮一峰的网络日志](https://www.ruanyifeng.com/blog/2019/09/getting-started-with-github-actions.html)

  - [怎么复用 GitHub Actions 的 Workflows](https://qq52o.me/2819.html)

  - [Composite Actions vs Reusable Workflows: what is the difference? [GitHub Actions]](https://dev.to/n3wt0n/composite-actions-vs-reusable-workflows-what-is-the-difference-github-actions-11kd)

  - [How to start using reusable workflows with GitHub Actions](https://github.blog/2022-02-10-using-reusable-workflows-github-actions/)

  - [What is a GitHub "Workflow" and how does it differ from an "Action"?](https://www.reddit.com/r/github/comments/17sbywi/what_is_a_github_workflow_and_how_does_it_differ/)

  - [Best Practices for Reusable GitHub Actions Workflows — Automated Testing](https://medium.com/@aihuawu2023/best-practices-for-reusable-github-actions-workflows-automated-testing-1f701cd635b5)

  - [Best Practices for Reusable Workflows in GitHub Actions](https://earthly.dev/blog/github-actions-reusable-workflows/)

  - [如何使用 GitHub Actions 实现开源项目的自动化](https://www.freecodecamp.org/chinese/news/automate-open-source-projects-with-github-actions/)

  - [使用 GitHub Actions 构建 CI/CD 流程](https://dgideas.net/2022/using-github-actions-build-ci-cd-workflow/)
