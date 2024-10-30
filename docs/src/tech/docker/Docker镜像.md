---
publish: true
date: 2021/09/21 13:00
title: Docker镜像
project: docker
tags:
- 技术
---

# Docker镜像

![img](/tech/docker/docker-image.png)

## 查看镜像

输入`docker images`可以查看到所有的本机镜像

```shell
[root@localhost ~]# docker images
REPOSITORY    TAG      IMAGE ID       CREATED       SIZE
hello-world  latest  feb5d9fea6a5   3 months ago   13.3kB
```

以下是对输出结果的解释：

- `REPOSITORY`：镜像的仓库源
- `TAG`：镜像的标签
- `IMAGE ID`：镜像的ID
- `CREATED`：镜像的创建时间
- `SIZE`：镜像的大小

当然对于这条命令，还可以加入以下两个常用选项

- `docker images -q`仅列出镜像的id

- `docker images -a`列出所有的镜像

这两个选项常常组合一起使用：`docker images -qa`列出所有镜像的id

## 搜索镜像

输入docker search 镜像名就可以搜索到相关联的镜像。使用这种方式搜索的镜像结果和在docker hub上搜索的镜像结果是一样的，只是不同的表达方式而已。一种用命令行，一种用UI。

## 下载镜像

输入`docker pull 镜像名[:tag]`就可以下载指定的镜像（这就好像下载一个软件安装包一样，下载下来后run起来的容器才是真正运行的程序）

```shell
[root@localhost ~]# docker pull mysql
Using default tag: latest # 如果不写标签，默认是最新
latest: Pulling from library/mysql
72a69066d2fe: Pull complete # 分层下载，docker image的核心就是联合文件系统
93619dbc5b36: Pull complete
99da31dd6142: Pull complete
626033c43d70: Pull complete
37d5d7efb64e: Pull complete
ac563158d721: Pull complete
d2ba16033dad: Pull complete
688ba7d5c01a: Pull complete
00e060b6d11d: Pull complete
1c04857f594f: Pull complete
4d7cfa90e6ea: Pull complete
e0431212d27d: Pull complete
Digest: sha256:e9027fe4d91c0153429607251656806cc784e914937271037f7738bd5b8e7709 # 镜像的签名
Status: Downloaded newer image for mysql:latest
docker.io/library/mysql:latest # 镜像的真实地址
# docker pull mysql 其实相当于
# docker pull docker.io/library/mysql:latest
```

我们还可以指定版本下载镜像

```shell
[root@localhost ~]# docker pull mysql:5.7
5.7: Pulling from library/mysql
72a69066d2fe: Already exists
93619dbc5b36: Already exists
99da31dd6142: Already exists
626033c43d70: Already exists
37d5d7efb64e: Already exists
ac563158d721: Already exists
d2ba16033dad: Already exists
0ceb82207cd7: Pull complete # 因为docker是分层下载镜像，所以不同版本的镜像用的可能是基础层，所以不需要下载。
37f2405cae96: Pull complete
e2482e017e53: Pull complete
70deed891d42: Pull complete
Digest: sha256:f2ad209efe9c67104167fc609cca6973c8422939491c9345270175a300419f94
Status: Downloaded newer image for mysql:5.7
docker.io/library/mysql:5.7
```

## 删除镜像

输入`docker rmi 镜像ID`，因为docker镜像被容器所依赖，所以如果有容器存在，依赖着镜像，那么这个镜像删除会失败。如果你想要强制删除这个镜像，可以使用`docker rmi -f 镜像ID`。当然往往我们在实际使用当中还想要一次性删除所有镜像，我们可以使用如下命令`docker rmi -f $(docker images -qa)`，其中`$()`用于执行子命令然后获取输出结果。
