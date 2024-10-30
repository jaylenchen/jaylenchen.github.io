---
publish: true
date: 2021/09/24 09:00
title: Docker运行原理
project: docker
tags:
- 技术
---

# Docker运行原理

![img](/tech/docker/docker-os.png)

Docker是一个client-server结构的系统，Docker的守护进程运行在主机上，通过socket从客户端进行访问。用户在docker-client使用docker-cli发出docker命令，docker-server接收到用户发过来的命令过后，就会执行这条命令。

![img](/tech/docker/docker-daemon.png)
docker之所以比虚拟机快，是因为docker比虚拟机拥有着更少的抽象层。docker利用的是宿主机的内核，vm需要的是Guest OS。所以说，新建一个docker容器，并不需要像新建一个虚拟机一样，重新加载一个操作系统内核。
