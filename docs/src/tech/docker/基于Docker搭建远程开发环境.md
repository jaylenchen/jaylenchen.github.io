---
publish: true
date: 2021/10/1 10:00
title: 基于Docker搭建远程开发环境
project: 通用技术
tags:
- docker
---

# 基于Docker搭建远程开发环境

## 使用Remote SSH连接远程主机

- 安装Remote SSH:打开VSCode，找到插件菜单搜索栏搜索“Remote-SSH”并安装

  ![img](/tech/docker/remote-ssh1.png)
  安装完毕后，你的VSCode左侧会多出一个电脑💻的图标菜单，点击该菜单如果展示的是如下面板就证明你安装Remote SSH成功，接下来我们要使用这个插件去连接我们的远程主机！
  ![img](/tech/docker/remote-ssh2.png)
- 连接远程主机
  找到SSH TARGETS文案，点击右侧的+，就会展示如下面板
  ![img](/tech/docker/remote-ssh3.png)
  接下来我们就可以在input框中使用ssh协议配置我们的远程主机了，面板如下
  ![img](/tech/docker/remote-ssh4.png)
  输入ssh协议配置你的主机，格式：ssh 用户名@远程主机ip（只是配置，而不是连接），确认后回车后，会接着展示如下面板
  ![img](/tech/docker/remote-ssh5.png)
  这个面板会询问你的ssh配置信息要存放到哪里去？这里我们选择放到自己本地机子的.ssh目录下，这个配置的名字就叫做config，比如我这里是`/Users/jaylen/.ssh/config`，这里头存放的就是你的ssh配置信息。选择好后，回车，会接着展示如下面板
  ![img](/tech/docker/remote-ssh6.png)
  看到右下角，这里会提示你Host added!。在这个弹窗中，我们选择connenct连入远程主机。到这里，我们可以说只是完成了基本配置。实际上并没有真正连接到远程主机当中。真正连接主机的步骤是在要打开远程主机的某个文件夹时，才会要求你输入连接远程的密码，那时候才是真正连接远程主机。
  首先将光标移动到显示远程主机列表，这里是10.211.55.3，你会发现光标悬浮的时候，右侧会展示出文件夹的图标
  ![img](/tech/docker/remote-ssh7.png)
  点击该文件夹图标，意思是打开某一个远程主机上的文件（其实前置步骤就是顺便就把远程主机连接上了），点击下去就会弹出新的VSCode面板
  ![img](/tech/docker/remote-ssh8.png)
  输入你的远程主机账号密码之后，你就登录了远程主机，面板如下
  ![img](/tech/docker/remote-ssh9.png)
  可以看到左上角的文案：已连接到远程，恭喜你已经连入了远程主机，接下来我们就可以在VSCode上打开你的远程文件了。

## 使用Remote Container在容器中开发

Visual Studio Code Remote - Containers扩展允许您使用Docker容器作为一个全功能的开发环境。它允许您打开容器内部(或安装到容器中)的任何文件夹，并利用Visual Studio Code的完整功能集。devcontainer.json文件告诉VS Code如何使用定义良好的工具和运行时堆栈去访问(或创建)一个开发容器。此容器可用于运行应用程序，或用于分离使用代码库所需的工具、库或运行时。工作空间文件从本地文件系统挂载或复制或克隆到容器中。扩展在容器中安装和运行，在容器中它们可以完全访问工具、平台和文件系统。这意味着您可以通过连接到不同的容器来无缝切换整个开发环境。

这让VS Code提供了本地质量的开发体验，包括完整的智能感知(完成)、代码导航和调试，而不管你的工具(或代码)位于哪里。我们从下面问题一个个思考，然后在实践过程中获得真知：

- 如何使用Docker容器来建立一个与本地环境隔离的开发环境。
- 如何通过使用Remote - Containers扩展在Docker容器中运行Visual Studio Code。
- 如何在container当中打开一个你电脑中已经存在的文件夹，去为现有的项目设置一个container开发容器，作为你的开发环境容器。
- 如何在container当中打开一个github项目。

我们先从整体框架说明一个Remote Container是如何搞出来的：

- 第一步，以你的dockerfile或者填写的`image:name`为构建镜像的依据，构建出你想要的镜像。
- 第二步，会以构建出来的镜像去运行一个容器，当这个容器启动的时候，容器就会使用你在`devcontainer.json`当中定义的配置。
- 第三步，最后你的vscode就会以你的`devcontainer.json`为依据去重新配置。
- 第四步，一旦以上的工作完成之后，新创建出来的容器里的vscode sever将会产生一个代码副本并在你本地的vscode中显示出来。

接下来我们正式进入Remote Container实现流程：

首先，克隆你的gitlab远程仓库。然后进入该目录，使用remote container扩展，建立.devcontainer文件夹，这个文件夹包含着你想要建立的开发容器需要的环境。

当我们建立好之后，就reopen container，然后就会以.devcontainer文件夹中的dockerfile创建出对应的镜像，然后进而启动开发容器。里头的环境就拥有了你自定制的环境。

为一个本地磁盘上的一个项目设置一个开发容器的思路：

1. 找到你本机上的一个项目代码目录，比如说一个音乐app项目，vue-music项目。这就是你想要设置一个开发容器的目录，它的意思是说，我想要让我的容器中含有这个项目目录，并且能够利用容器里头的环境进行项目的开发。要执行这样一个操作，可以在VSCode上执行`Remote-Containers: Open Folder in Container`然后将操作执行完毕。
2. 当然如果直接按照以上的操作，就是使用默认的容器配置，VSCode会依照默认配置去构建镜像，生成带有默认配置的开发容器。一般地，我们都需要对容器的配置进行定制，以符合我们自己公司的业务开发需要。所以我们可以先用VSCode打开本机当中你想要生成容器的项目，然后在VSCode执行`Remote-Containers: Add Development Container Configuration Files`生成.devcontainer文件夹，然后在里头对容器进行个性化定制。定制过后再进行`Remote-Containers: Open Folder in Container`
3. 如果你想要在dev container当中设置你的vscode的工作配置，可以在`.devcontainer.json`当中的`settings`属性中配置，配置的方式就跟你在本地的vscode配置相同，这样子的好处是可以统一所有协作人员的vscode配置。而且你还可以在`extensions`中配置远程vscode的扩展插件，扩展插件也可以在应用商店找到。这样一来，你的团队打开的dev container创造出来的远程开发环境就高度一致，这就好像你在每一台电脑上安装了vscode，并且配置了相同的`settings.json`和安装了相同的插件似的。
