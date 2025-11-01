---
publish: true
date: 2021/09/23 18:00
title: Docker网络
project: 通用技术
tags:
- docker
---

# Docker网络

![img](/technology/common/docker/docker-network.png)

使用传统的手法安装nginx和mysql的时候，这两个服务都是安装在一台机子上的，也就是我们的宿主机。因此安装完毕后，我们可以在nginx当中使用localhost+mysql的端口访问到mysql服务。但是当我们使用了docker的时候，nginx和mysql被安装在了两个容器身上，也就是相当于安装在了两台主机上，那么这个时候我们就无法在nginx当中使用localhost+mysql的端口去访问mysql服务了。但是为了完成项目服务之间的通信，我们就不可避免要进行容器与容器之间的通信。所谓的容器通信其实指的就是容器之间如何通过网络进行通信。

![img](/technology/common/docker/docker-network-nginx-mysql.png)

## docker0

```shell
[root@localhost ~]# ip addr
# 以下有三个网络，分别代表了三个不同环境
# 这是本机回环地址
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
        valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
        valid_lft forever preferred_lft forever

# 这是paralle desktop帮我们生成的网卡，内网地址
2: enp0s5: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 00:1c:42:b0:9a:ea brd ff:ff:ff:ff:ff:ff
    inet 10.211.55.3/24 brd 10.211.55.255 scope global dynamic noprefixroute enp0s5
        valid_lft 1195sec preferred_lft 1195sec
    inet6 fdb2:2c26:f4e4:0:5773:b6d1:943d:b9fc/64 scope global dynamic noprefixroute
        valid_lft 2591687sec preferred_lft 604487sec
    inet6 fe80::c097:faee:3e33:5960/64 scope link noprefixroute
        valid_lft forever preferred_lft forever

# 这是docker帮我们生成的网卡，docker地址
3: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default
    link/ether 02:42:d2:b0:38:6e brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
        valid_lft forever preferred_lft forever
    inet6 fe80::42:d2ff:feb0:386e/64 scope link
        valid_lft forever preferred_lft forever
```

我们每启动一个docker容器，docker就会给docker容器分配一个ip。当我们装上了docker之后，就会拥有一个docker0网卡，是桥接模式的，使用的技术就是veth-pair技术。veth-pair就是一对虚拟设备接口，是成对出现的，一段在容器内部，一段在主机docker虚拟网桥上。正因为有这个特性，才使用veth-pair充当桥梁，专门连接各种虚拟网络设备，达到主机跟容器之间的通信、容器跟容器之间的通信。
主机与容器的通信原理是：外部将消息传送给主机，主机再将消息传输给虚拟网桥，网桥再找到要传输到的容器在网桥中的对应接口，通过该接口转发给容器的eth0接口，这就实现了主机与容器之间的通信。
容器与容器的通信原理是：容器1通过自己的eth0转发信息给主机上的虚拟网桥那个跟容器1eth0配对的接口，然后再通过虚拟网桥转发给容器2在虚拟网桥上的那段接口，从这个接口出去发送给容器2内部的eth0接口，这就实现了容器与容器之间的通信。
![img](/technology/common/docker/docker-network-nginx-mysql.png)
容器1和容器2是共用的一个路由器-docker0。所有的容器不指定网络的情况下，都是docker0负责路由的，docker会给容器分配一个默认的可用ip。但是只要docker容器删除或者重启，ip就会变化，这样子每次启动都不同ip，对我们应用不友好，我们想要的是能够通过类似域名的方式去访问，而不论ip如何变化，最终都能找到对应名字的服务。

小结：默认的，docker容器创建的时候不自定义网络的情况下，都会连接到docker0网桥上，在docker0网桥上的容器都可以使用容器内的ip地址进行通信。但是因为ip漂移的问题，我们更想要使用容器名的方式去进行网络通信，而默认的docker0是没法使用容器名去进行网络通信的，所以实战中我们更应该是使用自定义网络，一个项目使用一个网桥。

## 查看所有docker网络

```shell
[root@localhost ~]# docker network ls
NETWORK ID     NAME      DRIVER    SCOPE
37c3f659d7a1   bridge    bridge    local
c8fbd96dbd65   host      host      local
9201f6eeeb36   none      null      local
```

网络模式：

- bridge桥接模式
- none不配置网络
- host主机模式：和宿主机共享网络

## 查看具体网络信息

输入`docker inspect 网络id`

```shell
[root@localhost ~]# docker inspect 37c3f659d7a1
[
    {
        "Name": "bridge",
        "Id": "37c3f659d7a1f4f2ab242061332e994780de64edb8f8c14171a02922b2548b30",
        "Created": "2021-12-28T17:25:06.321343701+08:00",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "172.17.0.0/16"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {},
        "Options": {
            "com.docker.network.bridge.default_bridge": "true",
            "com.docker.network.bridge.enable_icc": "true",
            "com.docker.network.bridge.enable_ip_masquerade": "true",
            "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
            "com.docker.network.bridge.name": "docker0",
            "com.docker.network.driver.mtu": "1500"
        },
        "Labels": {}
    }
]
```

## 容器互联--link

```shell
docker run --name tomcat1 --link  tomcat2 tomcat
```

使用--link就可以实现刚刚产生的问题，但是这种方式的坑还是比较多的。其实能够用这种tomcat02 的方式，本质是因为tomcat1在hosts中增加了tomcat2的host而已。真实开发当中，不建议使用--link!所以说使用docker0网络是不适用名字方式去访问的。一般开发当中，我们还是会使用自定义网络的方式去玩docker。

## 自定义网络

输入`docker network create 自定义网络名 --driver 指定网络模式（不写默认是bridge模式）--subnet 子网（比如192.168.0.0/16）--gateway 网关（192.168.0.1）`

```shell
[root@localhost ~]# docker network create mynet \
> --driver bridge \
> --subnet 192.168.0.0/16 \
> --gateway 192.168.0.1
a1ae83ffe4df922d53011a9fc61e6491b1054673c0beed745ba4f997a5677e40
```

```shell
[root@localhost ~]# docker network ls
NETWORK ID     NAME      DRIVER    SCOPE
37c3f659d7a1   bridge    bridge    local
c8fbd96dbd65   host      host      local
a1ae83ffe4df   mynet     bridge    local # 自定义的新网络
9201f6eeeb36   none      null      local
```

```shell
[root@localhost ~]# docker inspect a1ae83ffe4df
[
    {
        "Name": "mynet",
        "Id": "a1ae83ffe4df922d53011a9fc61e6491b1054673c0beed745ba4f997a5677e40",
        "Created": "2021-12-29T11:57:42.355064358+08:00",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": {},
            "Config": [
                {
                    "Subnet": "192.168.0.0/16",
                    "Gateway": "192.168.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {},
        "Options": {},
        "Labels": {}
    }
]
```

之后我们就可以使用这个网络，创建容器的时候加入这个网络当中了。自定义的网络天然支持名字的方式网络访问，内部已经帮我们维护好了相关的容器关系。使用自定义网络的好处是：不同的集群可以使用不同的网络，保证了集群的安全性。

## 网络连通

输入`docker network 自定义网络名 connect 容器名`将某个容器加入docker自定义的网络当中。
首先，我们先不将容器加入mynet自定义网络当中

```shell
[root@localhost ~]# docker exec -it nginx ping nginx01
ping: nginx01: Name or service not known
```

我们发现，网络没法ping通。现在我们将容器加入网络中再试试

```shell
[root@localhost ~]# docker network connect mynet nginx
[root@localhost ~]# docker network connect mynet nginx01
[root@localhost ~]# docker exec -it nginx ping nginx01
PING nginx01 (192.168.0.3) 56(84) bytes of data.
64 bytes from nginx01.mynet (192.168.0.3): icmp_seq=1 ttl=64 time=0.844 ms
64 bytes from nginx01.mynet (192.168.0.3): icmp_seq=2 ttl=64 time=0.083 ms
64 bytes from nginx01.mynet (192.168.0.3): icmp_seq=3 ttl=64 time=0.088 ms
64 bytes from nginx01.mynet (192.168.0.3): icmp_seq=4 ttl=64 time=0.104 ms
64 bytes from nginx01.mynet (192.168.0.3): icmp_seq=5 ttl=64 time=0.077 ms
64 bytes from nginx01.mynet (192.168.0.3): icmp_seq=6 ttl=64 time=0.083 ms
64 bytes from nginx01.mynet (192.168.0.3): icmp_seq=7 ttl=64 time=0.097 ms
```

结果我们发现现在两个容器之间就可以ping通了，这就是docker网络连通。
小结：容器网络互连的两个场景有：

- 在容器启动时去指定运行在某个指定网络当中`docker run --net 指定网络`，
- 在容器1运行的时候加入某个网络当中`docker network connect 容器1`。

## 删除没被用到的网桥

`docker network prune`

```shell
[root@localhost www]# docker network prune
WARNING! This will remove all custom networks not used by at least one container.
Are you sure you want to continue? [y/N] y
Deleted Networks:
mynet
web

[root@localhost www]# docker network ls
NETWORK ID     NAME      DRIVER    SCOPE
37c3f659d7a1   bridge    bridge    local
c8fbd96dbd65   host      host      local
9201f6eeeb36   none      null      local
```

删除没用到的网桥要注意是不会去删除默认的三个的。
