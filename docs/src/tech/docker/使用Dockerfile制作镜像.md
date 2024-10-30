---
publish: true
date: 2021/09/25 14:00
title: 使用Dockerfile制作镜像
project: docker
tags:
- 技术
---

# 使用Dockerfile制作镜像

![img](/tech/docker/dockerfile.png)
如果你想要自己做一个Docker镜像，那么你可以有两种方法去制作一个自己的镜像。一种方式是利用Docker命令docker commit，而另外一种更好的方式就是使用Dockerfile文件。Docker引擎它认识Dockerfile，可以读取Dockerfile文件中的一行行的指令，来帮助你去构建镜像。
使用Dockerfile就好像写一份菜谱一样，我们想要特朗普知道怎么样去炒一道小鸡炖蘑菇，我们首先将小鸡炖蘑菇的制作流程写出来成为一份菜谱，特朗普拿到菜谱之后就知道如何去制作一道小鸡炖蘑菇了。Dockerfile本质上就是一个文本文件，我们可以在Dockerfile文件上一行行写好如何去构建我们想要的镜像，然后交给Docker引擎去按照我们在Dockerfile上要求的做法去构建我们的镜像。

## Dockerfile构建镜像原理

本质上，Dockerfile就是一个十分普通的文本文件，真正有意义的是里头的内容，这些内容是有关于Docker的一条条指令。你可以在你电脑中创建一个目录，再在这个目录里头创建一个名为Dockerfile的文件。假设此时你已经在Dockerfile当中写入了相关指令，那么接下来我们就需要基于这个Dockerfile文件使用Docker为我们提供的docker build指令去提交请求给Docker server构建一个新的镜像。详细的过程是：Docker会将`docker build -t bingo-admin:1.0` 这条命令中指定的上下文目录进行打包，这里就是.当前目录。通常，这个上下文目录里头应该要是包含了Dockerfile的目录（当然上下文会由你自己自定义，但是如果你指定的上下文目录不存在Dockerfile，Docker Server就会报错）。Docker Client一旦打包完后，就会将这个上下文目录上传给Docker Server。这样一来，Docker Server就能够获取到docker build 上下文目录这个指令指定的上下文目录了。于是Docker Server从上下文目录当中取出Dockerfile，读取里头的内容，依照一条条指令进行镜像的构建。因此，从这个角度来看，上下文目录绝对不要放置跟我们实际构建无关的东西，否则会导致镜像的构建十分缓慢。比如说：我们选择/跟目录去作为上下文目录，这里头就涵盖很多无关构建的东西，这样子会导致打包上下文目录十分缓慢（想象一下打包一个几十G的目录），进而导致构建镜像时间漫长。

当Docker Server开始依照Dockerfile进行镜像构建的时候，Docker Server会一行行读取指令。当读取第一行的时候，Docker Server会构建出一个临时镜像。事实上，每一行指令都会跟第一行一样，构建出一个临时镜像。当读取第二行指令的时候，就会基于第一行构建出来的临时镜像的基础上再构建出一个临时镜像。当读取到最后一行的时候，就会形成一个最终的镜像。当然，形成最终的镜像的时候，你将不会看到中间的那些临时镜像，而只能看到最后形成的镜像。

实际开发当中，你可能会不断的去修改Dockerfile，然后重新构建镜像。比如你第一次写了两行，构建出一个镜像。感觉效果不满意，又继续加了三行去构建镜像（此时有5行指令了）。但是事实上，这个新镜像所对应的5行指令的Dockerfile之前已经有2行是构建出2层镜像的了，我们没必要从头开始一层层镜像叠加构建。于是，为了解决这个问题，Docker引入了缓存的概念。当我们在构建这个2行指令的镜像后会缓存这些层的镜像，当你添加了3行继续构建时，会从原有构建好的2层镜像的基础上直接从缓存取出，然后直接构建第三层镜像，而不是像一开始那样从第一层重新开始构建。

当然，如果你不想在修改Dockerfile后继续使用之前缓存的镜像层，你可以在build的时候加上参数--no-cahce，即docker build -t xxx . --no-cache。

如果你不想要让上下文目录当中的一些文件参与镜像构建，实际上，你还可以在目录里头加上.dockerignore，忽略掉你指定的文件，这样一来Docker Server构建镜像的时候就不会构建.dockerignore文件当中指定的文件了。

## Dockerfile常用指令解读

Dockerfile中的一条指令构建一层镜像，所以说一定只添加必要的东西，同时不要去添加一些没有意义的层，能写在一层，也就是写在一条指令当中，就尽量写在一条指令当中。

- `FROM`：它告诉了你当前镜像是基于什么基础镜像开始构建的。
- `USER`：它定义Docker里头是以什么用户操作的。
- `WORKDIR`：它告诉了你当你进入Docker容器的时候会到哪一个目录去。
- `ADD`：它告诉了你要把本地的哪一个文件/目录拷贝到Docker容器当中的哪个位置去。
- `ENV`：它定义了Dockerfile的变量，同时也可以定义成Docker容器内部的环境变量。环境变量就像是你在Linux系统中的shell终端输入env打出来的那一堆东西，同样的你可以在Docker里面使用在Dockerfile上定义的环境变量。
- `RUN`：它告诉了你，可以在Docker构建镜像的时候去执行shell命令。这个指令所执行的操作都会封装到镜像上，也就是固化到了只读层。
- `EXPOSE`：它告诉了你容器当中哪一个端口需要被暴露出来。这个指令常常是给`-P`用的，如果使用`-p port:containerPort`那么指令并没有生效。
- `CMD`：它告诉了你，可以在Docker容器运行的时候去执行shell命令，即可以在`docker run`一个容器启动以后执行CMD的内容，而不是使用`/bin/bash`这条命令去执行内容（就是`docker run -d -it xx /bin/bash`）。
- `ENTRYPOINT`：它告诉了你，每一个Docker容器都有一个默认的启动命令，即执行Docker容器里头的/entrypoint.sh脚本

## 理解docker build

docker本质是一套C/S架构的平台，我们的所有操作都是docker客户端调用API操作docker服务器的方式。因此对于docker build -t myapp:v1.0 .这条命令也是不例外的。

```shell
myapp
├── Dockerfile
├── myapp.txt
└── src
   └── src.txt
```

`docker build -t myapp:v1.0` 实际上的工作过程是：指定要打包给docker服务器的文件夹路径，这里指定的就是当前目录.，也就是myapp这个文件夹。于是docker就在客户端打包这个文件夹，然后发送给docker服务器。docker服务器接收到该文件夹之后，就解压这个文件夹，然后会默认在这个文件夹下搜索Dockerfile这个文件去进行镜像的构建。

在Dockerfile里头，我们写的路径都是相对于我们在客户端写`docker build -t myapp:v1.0`指定的上下文所在的目录。所以如果写的路径所对应的文件在指定的这个目录当中是不存在的，那么docker是会报错的。

如果Dockerfile不在我们指定的上下文当中，那么我们可以显示去指定`docker build -t myapp:v1.0 . -f ../Dockerfile`。此时执行这条命令的时候我们是进入到了`myapp/src`下，指定这个目录是上下文，然后Dockerfile在上一层目录当中。

## 参考

- 视频
  - [如何在生产中编写最优Dockerfile](https://www.bilibili.com/video/BV1xe411K796/?p=7&vd_source=c899446e6f6ea3d984a4622ddf9c14a1)
