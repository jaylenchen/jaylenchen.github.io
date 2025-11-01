---
publish: true
date: 2021/09/22 16:00
title: Docker数据卷
project: 通用技术
tags:
- docker
---

# Docker数据卷

![img](/technology/common/docker/docker-volume.png)
使用数据卷的目的是为了容器的持久化和同步操作。如果容器间用同一个目录还可以进行数据共享。

## 使用数据卷

```shell
# 直接使用命令来挂载 -v 主机目录:容器目录
docker run -it -v 主机目录:容器目录 --name centos1 centos
```

## 具名挂载和匿名挂载

```shell
# 匿名挂载 -v 容器目录（不要写主机目录，同时不写一个要放置在主机上的数据卷名）【不建议使用】
docker run -v /etc/nginx nginx

# 具名挂载 -v 具名：容器目录【推荐使用】
docker run -v nginx:/etc/nginx nginx

# 查看卷的位置 （实际上放在主机的/var/lib/docker/volumes/_data中）
docker volume inspect 卷id/卷名
```

## 查看所有数据卷

```shell
docker volume ls
```

## 指定挂载数据卷的读写权限

```shell
# 注意⚠️：限制的是进入容器后对这个数据卷的操作，限制对象是容器，不是宿主机！
# -v 卷名：容器目录：读写权限
# ro readonly的意思
# rw 可读可写的意思
docker run -v nginx:/etc/nginx:ro nginx

docker run -v nginx:/etc/nginx:rw nginx
```

## 多个容器间数据共享

![img](/technology/common/docker/docker-volume.png)

```shell
# docker2不指定-v，直接使用--volume-from和docker1共享数据
docker run -it --name docker2 --volume-from docker1 nginx
```
