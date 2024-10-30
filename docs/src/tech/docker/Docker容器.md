---
publish: true
date: 2021/09/21 13:00
title: Docker容器
project: docker
tags:
- 技术
---

# Docker容器

![img](/tech/docker/docker-cmds.png)

## 创建容器

```shell
docker run [--参数] 镜像名
```

以下是对参数的说明

- `--name=“容器名字”` 给容器起名字，用来区分容器
- `-d`放在后台运行此容器
- `-it`以交互的方式运行容器，进去容器查看内容
- `-p`指定容器的端口。格式`-p 主机端口：容器端口`，意思是将容器端口映射到主机端口上
- `-P`

## 查看正在运行的容器

```shell
[root@localhost ~]# docker ps
CONTAINER ID  IMAGE  COMMAND  CREATED  STATUS  PORTS  NAMES
```

## 退出容器

```shell
# 退出并停止
exit
# 只退出不停止
ctrl+P+Q
```

## 删除容器

```shell
docker rm 容器id
docker rm -f 容器id
docker ps -aq | xargs docker rm # 删除所有容器
```

## 启动容器

```shell
# 启动
docker start 容器id
# 重启
docker restart 容器id
# 后台启动
docker run -d 镜像名
```

## 停止容器

```shell
# 停止
docker stop 容器id
# 强制停止
docker kill 容器id
```

## 查看容器信息

```shell
docker insepct 容器id
```

## 进入当前正在运行的容器

```shell
# 方式1 可在里头操作
docker exec -it 容器id bashshell
# 方式2 进入的是正在运行的终端，常常不能操作
docker attach 容器id
```

## 将容器里的文件拷贝到主机上

```shell
docker cp 容器id:文件路径 主机上的文件路径
```
