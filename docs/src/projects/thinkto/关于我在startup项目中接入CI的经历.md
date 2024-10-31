---
publish: true
date: 2024/08/4 11:00
title: 关于我在startup项目中接入CI的经历
project: thinkto
tags:
 - cicd

---

# 关于我在startup项目中接入CI的经历

关于CICD的相关好处是众所周知的，它避免了人为的手动构建，统一了构建时刻所在的环境，同时集成了一系列相关的流程，如代码风格校验、代码自动化测试、镜像构建等。无论是startup还是中大厂，CICD基本上是各个团队研发流程中的标配，不同的只是各环节的选取和详尽程度。这篇文章把目光聚焦在一个从0开始的startup项目接入CI的过程，分享在startup项目中接入CI所经历的那些事。

## 新平台从零开始

假如你和他人合伙建立了一个新的平台，你们决定大干一场做一个新的项目。你们讨论了项目的需求背景、要解决的用户痛点、项目的迭代规划后立项完毕开始撸起袖子各显神通。项目的呈现形式选取的是web平台，因为它成本相对于其他终端更低，startup项目不讲究太多，先做出来暴力推，有问题才能及时调整战略和方向。而你负责的是整个前端项目的相关研发流程的管理，带领着小组成员开发前端部分的项目功能。在经过前期的准备，你们经历过了前几个研发阶段，终于来到了构建发布阶段。不同于往日，在前几年你经历了其他平台的项目，也参与过这个环节，似乎一切都很简单，有人告诉你当时的平台的项目构建发布阶段应该这么做。但你突然发现自己建立了新平台后，做项目的时候，一切仿佛回到了起点，你一下子感到了从前那种熟悉的技术陌生感。不过没关系，以往的研发经验告诉你这个环节要做的就是CI的接入，于是凭着经验你开始接入CI。

## 迈出接入CI第一步

![img](/projects/thinkto/coding-ci-panel.png)

由于团队将代码托管到了[Coding](https://coding.net/)平台，既然要接入CI，按照以往的经验我们先要有CI相关的环境工具，这几年你用过Jenkins、Gitlab CI、Github Actions，用的最多的还是Jenkins。于是你凭着经验的直觉，列下了相关的准备环境和工具：

- 云服务器
- Docker + Docker Compose
- Jenkins Docker镜像
- 相关Web Hook

看起来好像没啥问题，但等等，我们真的需要自建CI平台吗？代码管理平台是否已经有这样的功能？我们发现Coding已经为我们提供了这样的平台功能，我们只需要在CI板块创建对应的构建计划，然后填写一份Jenkinsfile将它放置到源代码中就好了，而其他相关的CI预备环境Coding已经帮我们做了，作为一个startup团队，我们需要学会将相关功能外包出去，节省开发资源。至此，我们迈出了项目接入CI第一步，将项目在构建发布阶段需要做的事托管给了Coding，利用Coding的持续集成板块来完成我们项目的CI。

### 小结

如果你的团队人员不够多，资源不够丰富，先想想是否在代码管理平台上已经做了相关板块？大多数代码管理平台类似于Coding、GitHub、Gitlab都有持续集成板块，不需要自己从头开始搭建CI平台，我们要做的仅仅是利用第三方平台指定的配置文件填写CI流程要做的必备事项即可。借助第三方成熟的CI板块我们只做其中必备的工作能节省不少研发资源，特别是对于startup团队资源不太够基本上运维都是开发来充当，这个时候更能体现出第三方成熟CI的优势，解放开发生产力，专业的事交给专业的人来做，用的对不如用的巧。

## 利用第三方CI板块提供的配置文件告诉Jenkins你要做什么？

现在我们已经成功将CI托管给了Coding代码管理平台来做，这个平台的CI板块用的也是你熟悉的Jenkins，我们可以利用Jenkinsfile来告诉Jenkins我们在CI阶段要做些什么。那我们分析下到底在CI阶段要做哪些事？

- 回到项目研发流程，我们处于研发环节的构建发布阶段，做的是一个web项目的前端模块，我们的责任就是将这个前端项目构建出来，最终发布到服务器，让用户浏览器能够访问项目的地址来体验我们的项目。
- 从发布角度来说，我们使用的是容器化部署，我们会希望将项目构建出来后丢到docker容器中，通过配合简单的nginx配置来提供服务。我们实际要做的事情就是：为构建阶段写Dockerfile和nginx配置。

因此仅从必备步骤来说，我们要做的事情是：

1. 告诉CI机器人拉取项目源代码
2. 告诉CI机器人构建项目
3. 告诉CI机器人使用docker按照指定的Dockerfile构建镜像，然后推送到指定的镜像库。（对于生产环境，我们还需要推送到指定的helm中，方便后端同学使用k8s更新项目）

### 小结

是的，我们要告诉Jenkins的必备步骤只需要上面这三个。我们要的CI阶段的产物就是将docker镜像构建出来，由于我们没有接入CD，所以还是需要手动地将docker镜像下载下来然后手动部署起来。我们使用的是[Portainer](https://www.portainer.io/)这个东东，你只需要配置相关数据凭证和docker registry，就可以可视化操作相关镜像，虽然在这个年代大部分人不用它了，但是如果你要想使用一个可视化平台查看以及部署一个简单的docker镜像测试环境，Portainer是个不错的选择，至少对startup团队来说还是体验不错的，不需要每次敲命令行了，虽然我知道黑白terminal很酷。

## 一个前端项目使用容器化部署要做些什么？

在离开了一个大平台的前提下，自己建立新平台做一个web项目，到了构建发布阶段产品要部署可以有哪些方式？基本上业界有两种，一种是借助paas平台，将自己的源代码提交过去让paas平台帮你构建，然后利用paas平台的服务帮你部署项目，你要做的就是写业务代码，其他的事情交给paas平台。对于前端服务的平台有[Netlify](https://www.netlify.com/)、[Vercel](https://vercel.com/)，对于后端服务的平台有[Fly.io](https://fly.io/)、[Railway](https://railway.app/)。而一种是基于容器化部署，利用docker构建产品镜像，丢到云服务器跑。自由度稍高，麻烦点就是对于前端需要配置下nginx。当然还有第三种选择，基于上面的两种形式自建自己的平台，但我们说过startup团队天然不具备这种能力和资源，我们要做的就是仅仅贴近两个字“粗暴快速”。

对于我们团队，我们选择的是容器化部署。那么我们就要做容器化部署应该要做的事。

- 写Dockerfile
- 写Nginx配置

### 写Dockerfile

Dockerfile的书写只需要稍稍上手特别简单，大概如下：

![simple-dockerfile](/projects/thinkto/simple-dockerfile.png)

为了节省Docker镜像体积，我们按照业界基操也搞成了Docker多阶段构建，第一个阶段构建App，第二个阶段部署App。

对于构建App阶段我们做了下面这些事：

- `FROM node:16.20.0-alpine as build-stage`：基于Node基础镜像进行构建，我们将这个阶段命名为`build-stage`。
- `COPY . /app`：拷贝当前项目内容目录到容器的`/app`目录当中。（请注意符号.代表的意思，这个需要对docker的构建原理熟悉，不熟悉自行查阅，不赘述）
- `WORKDIR /app`：切换到`/app`目录下。
- `RUN npm install`：在`/app`目录下，执行`npm install`拉取项目依赖。
- `RUN npm run build:prod`：在`/app`目录下，执行`npm run build:app`构建项目。

对于部署App阶段我们做了下面这些事：

- `FROM nginx:stable-alpine as deploy-stage`：基于Nginx基础镜像进行构建，我们将这个阶段命名为`deploy-stage`。
- `USER root`：我们将用户权限提升到root
- `COPY --from=build-stage /app/dist /usr/share/nginx/html`：将build-stage的路径为`/app/dist`的这份构建产物内容拷贝到Nginx容器中的`/usr/share/nginx/html`目录下。（注意，是拷贝dist内容，而不是dist本身）
- `COPY nginx.conf /etc/nginx/conf.d/default.conf`：将源码中的`nginx.conf`内容拷贝到Nginx容器中的`/etc/nginx/conf.d/default.conf`中。
- `EXPOSE 80 443`：暴露Nginx容器端口为80和443。
- `CMD ["nginx", "-g", "daemon off;"]`：容器启动，并以后台守护进程的方式启动。

### 写Nginx配置

既然用了Nginx服务器来提供web静态资源服务，那我们是不是需要告诉Nginx，控制Nginx服务器做些什么？让我们先来想想看我们如果要搞台服务器提供静态资源服务，我们想要什么：

- 我希望服务器运行中容器中本地的80端口（127.0.0.1:80）
- 我希望将静态文件放在`/usr/share/nginx/html`目录下
- 我希望访问`/`的时候能够读取到我的首页
- 我希望访问`/assets`的时候能够访问到相关媒体文件

列下我们想要Nginx服务器做的事情，那我们给Nginx提供一份配置告诉他我们希望它做什么。我们把nginx配置补充上：![simple-nginx](/projects/thinkto/simple-nginx.png)

### 小结

对于容器化部署，我们需要一份Dockerfile告诉Docker按照我们填写的要求和流程来构建一个Docker镜像。对于Nginx服务器，我们需要一份Nginx配置来告诉Nginx如何执行静态服务。

Nginx配置看起来特别熟悉，在web开发中，我们似乎见过类似的配置，`vite`和`webpack`相关的工具似乎为我们提升开发效率的时候提供了这样类似的配置文件，不同的是`vite`中叫`vite.config.ts`，`webpack`中叫`webpack.config.ts`，而`nginx`中常常叫`nginx.conf`，只不过是叫法不同，配置使用不同，所使用到的环境不同，本质意义上它们的server功能要做的事情基本相同。

而Nginx和Docker的关系仅仅是Docker为我们提供了一台Nginx服务器，Nginx藏在Docker里头，它跑在Docker里头，这就是为啥我们在Dockerfile中要拷贝源码目录中的Nginx配置到Docker里头的Nginx服务器提供服务的目录下的原因。

好像真的很简单？噢！恍然大悟...

## 开发、测试、生产多环境下我们该如何应付？

看起来似乎我们已经搞定了基本的构建发布流程，但让我们耐心想想我们还能做点什么？仔细观察，我们发现上述阐述的流程中，似乎并没有带上“环境”这个概念一起思考。我们一直默认的是打包一个生产环境用的镜像，但如果我们需要一个测试环境的镜像怎么办？如何解决“环境变量”相关的问题？

简单朴素的想法是复制多个`Dockerfile`，命名为`Dockerfile.test`，`Dockerfile.prod`，在做CI构建的时候开多个CI构建计划，不同的流水线构建不同的`Dockerfile`文件。而在前端项目的源代码中配合`dotenv`这个npm包，以及建立`.env.test`和`.env.production`，将不同的环境配置写入对应的`.env`配置文件中，最后再在项目的`package.json`当中启动构建的时候加入环境变量`cross-env NODE_ENV=test`或者是`cross-env NODE_ENV=production`。在`Dockerfile`中需要更改的地方就是构建App阶段的构建命令为`npm run build:test`或者是`npm run build:prod`，根据不同环境的构建计划启动的时候就能够根据不同的环境变量做到切换环境部署了。

上面的想法是很符合优化直觉的，但仔细想想我们是否还能做的更好一点？就目前来说，我们还有接下来要讲的nginx可能需要代理后端API接口，那么不同的环境就有不同的后端API地址，按照目前的做法，我们就需要同样地为每个环境的Dockerfile配置一个对应环境的Nginx。于是我们的容器化部署流程一下子从2个文件，变成了至少4个文件，如果还有更多环境每增多一个环境就是2个文件的增量，真的有必要么？

除去这些不谈，将跟环境相关的配置直接配置在前端项目的env文件当中，似乎也有欠考虑不妥当的地方：一个是随着环境的增多，单纯的env文件就会跟着增多。另一个是项目源代码是经常修改的地方，假如某天哪个同学调皮手痒一下子改了某个环境变量试试效果，后果将是不堪设想的。由此看来，我们至少不能将敏感的环境变量放在配置文件里头，那么是否有更好的方式来解决此类问题呢？

为了解决这个问题，我们回到研发流程中去找答案：现在处于构建发布阶段，同时还应用了CI，接着CI帮我们按照Dockerfile的要求调用docker构建镜像，然后用了我们配置的nginx配置，最后打出来镜像送到制品库去等待部署。诶？等等！如果CI平台有配置环境变量的功能，我们将环境变量不再放在配置文件中，而是改成通过平台的CI板块动态地注入对应环境的环境变量，让CI机器人在构建的时候读取这些环境变量，最后再利用这些环境变量去做我们之前的事情，问题不就迎刃而解了？至少至少我们不再需要担心敏感数据放在源代码中泄漏，它是放在平台的CI板块构建计划中做的事情，而且未来我们如果真的泄漏了需要改一下相关的环境配置，比如服务地址、OSS地址等，我们可以直接修改了重新构建就好了，不再需要去动前端项目的源代码，岂不美哉？

按照我们的新设想到Coding上寻找，果然找到了对应的CI功能块，大概长这样：
![coding-ci-env](/projects/thinkto/coding-ci-env.png)

通过Coding的CI环境变量配置，允许我们在CI进行中动态注入环境变量，让我们能够在CI阶段利用这些环境变量做些事情。回顾我们刚刚的问题：

### 如何解决多环境下Dockerfile构建App阶段构建命令需要根据环境切换的问题？

我们可以利用docker提供的`--build-arg`参数，配合着CI进行时注入的环境变量，我们就能够达到构建App阶段去切换使用不同的构建命令，不再需要创建多个不同环境的`Dockerfile`文件。比如这样：`docker build --build-arg BUILD_COMMAND="build:prod"`，那么在`Dockerfile`中，你只需要使用`ARG`字段定义对应的arg字段，就能够直接使用docker运行时传进来的arg参数。比如在Dockerfile中这样写`ARG BUILD_COMMAND`，这样一来我们需要替换之前构建App阶段的构建命令，从`npm run build:prod`，替换成`npm run ${BUILD_COMMAND}`。

### 如何解决多环境下Nginx配置根据环境切换Server服务地址的问题？

要实现Nginx配置动态化，思路就是不再将原来的Nginx配置文件看成普通的配置文件，而是将其看作一个新的模板文件。我们还是从一份经典的Nginx配置开始看起：

  ```nginx
  server {
      listen 80;
      server_name 127.0.0.1;

      root /usr/share/nginx/html;

      location / {
          try_files $uri $uri/ /index.html;
      }

      location ^~ /api/ {
          proxy_pass 生产环境服务器地址; # CI阶段构建镜像应该动态注入环境对应服务api地址
      }

      error_page 500 502 503 504 /50x.html;
      location = /50x.html {
          root html;
      }
  }
  ```

上面是一份常见的简单nginx配置，使用了`proxy_pass`反向代理相关接口到指定的服务器地址上。现在我们要做的事情就是将这个地址改成根据CI阶段的环境变量传入使其动态变起来。我们刚说了要实现这个功能，我们必须将其看作一个模板，具体思路就是在Docker容器跑起来之前，我们就根据配置模板动态生成对应环境的实际配置，然后才把Nginx服务的docker容器跑起来，这样一来不就可以实现nginx配置的动态化了吗？

#### 前置知识

在此之前，让我们了解一个命令行工具，叫做`envsubst`。`envsubst` 是一个用于替换文本文件中环境变量的工具。它通常用于在 Docker 和 CI/CD 管道中动态生成配置文件。`envsubst` 能够将环境变量的值插入到文本文件中。例如，你可以在一个模板文件中使用环境变量占位符，然后使用 `envsubst` 将这些占位符替换为实际的环境变量值。光说感觉干巴巴的，举个例子会好些。

假设你有一个模板文件 `config.template`，内容如下：

```shell
DATABASE_URL=${DATABASE_URL}
API_KEY=${API_KEY}
```

你可以使用 `envsubst` 将环境变量替换为实际值：

```shell
export DATABASE_URL="mysql://user:password@localhost/db"
export API_KEY="1234567890abcdef"

envsubst < config.template > config.conf
```

生成的 `config.conf` 文件内容将是：

```shell
DATABASE_URL=mysql://user:password@localhost/db
API_KEY=1234567890abcdef
```

#### 工具落地

我们将`Dockerfile`的末尾改下

```dockerfile
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]
```

上面我们在部署App阶段中的末尾，多加了两行:

```shell
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
```

意思是，我们希望在容器启动之前，执行一个shell脚本。同时为了能够让这个脚本正常启动，我们不要忘了给脚本添加可执行权限。在Unix风格系统中，给文件添加可执行权限的命令是`chmod +x`，上面的意思就是给`docker-entrypoint.sh`添加上可执行的权限，让它能够顺利地被docker执行起来。而执行的这个脚本长啥样呢，我们继续往下看`docker-entrypoint.sh`的内容：

```sh
#!/usr/bin/env sh
set -eu

echo -e "\033[0;32mAPI服务：${API_SERVER} 提供服务中..\033[0m"

envsubst '$API_SERVER' <nginx.template >default.conf

exec "$@"
```

这个脚本的主要功能是使用 `envsubst` 工具将 `nginx.template` 文件中的占位符 `${API_SERVER}` 替换为实际的环境变量值，并生成最终的 `default.conf`配置文件，然后启动 Nginx 服务。

- `#!/usr/bin/env sh`：指定使用 `sh` 解释器执行脚本。

- `set -eu`：启用严格模式，`-e` 表示遇到错误时立即退出，`-u` 表示使用未定义变量时退出。

- `echo -e "\033[0;32mAPI服务：${API_SERVER} 提供服务中..\033[0m"`：打印 API 服务信息。

- `envsubst '$API_SERVER' <nginx.template >default.conf`：使用`envsubst`替换环境变量。具体地，在这里头是将`nginx.template`模板中的变量`${API_SERVER}`替换掉，而它的真实值就是CI构建计划中配置的`API_SERVER`环境变量。最后我们再写入到`nginx`的`default.confg`文件中。(当然，在此之前，别忘了将目录切换到nginx提供服务的文件夹下：`WORKDIR /etc/nginx/conf.d`)

- `exec "$@"`：执行传递给脚本的命令，这里通常是启动 Nginx 服务的命令。`exec "$@"` 确保了传递给脚本的命令（如 `[nginx -g 'daemon off;']`）会直接执行，并替换当前的 shell 进程，从而使得 Nginx 成为容器的主进程。

最后我们还需要将nginx的模板配置改成如下：

```shell
  server {
      listen 80;
      server_name 127.0.0.1;

      root /usr/share/nginx/html;

      location / {
          try_files $uri $uri/ /index.html;
      }

      location ^~ /api/ {
          proxy_pass $API_SERVER/; # CI阶段构建镜像应该动态注入环境对应服务api地址
      }

      error_page 500 502 503 504 /50x.html;
      location = /50x.html {
          root html;
      }
  }
```

 这样一来，你只需要在你的CI构建计划中更改对应的`API_SERVER`的值，就能够在Docker构建镜像的时候顺便生成一份带有对应环境的服务接口地址的Nginx配置了。

### 小结

多环境的参与给CI阶段带来了一定的复杂度，但我们也通过直面相关的问题见招拆招，一个问题一个问题的解决。从多环境使用多配置的初始场景，我们通过梳理研发流程，发现了当前的研发阶段被代码控制平台Coding的CI板块接管，再配合CI阶段的特性我们拥有了是否能够将环境变量独立出来交给CI来动态注入的大胆设想，进一步地我们通过查询相关资料以及探索Coding平台的CI面板发现了解决问题的基础：在CI阶段能够注入环境变量。更进一步地，我们发现了`docker`也提供了在构建进行时允许你通过`--build-arg`往`Dockerfile`里头注入arg参数的方式从而让我们想到了通过这种方式去解决docker都阶段构建时在构建App阶段命令构建的问题。再者，我们还通过探索nginx动态模板的可行性，发现了`ensubst`这个命令行工具，从而形成了动态构建nginx模板的方案，解决了多环境下通过CI阶段我们可以做到动态注入环境变量来达到nginx反向代理不同的`API Server`。当然，CI阶段我们可以动态注入的配置还有很多，比如web静态资源加速优化，我们往往结合oss+cdn的方案，那么我们可以选择在Dockerfile构建的时候，使用oss工具上传静态资源，通过CI阶段环境变量的注入，我们可以上传到不同的oss地址去。更多的功能来源于更多的需求，总会有用的起来的地方。

## 总结

构建发布阶段属于研发流程当中一个比较重要的环节，为了解决不再手动构建发布测试的问题引入了CICD这个概念。CICD在各个平台甚至是各个团队的实现方式都不大相同。比如，你是做客户端的，那么实际上发布前应该还有数字签名、打包应用程序等工作。再比如，你的团队人员很多，那么实际上对规范要求也很严格，可能就需要对代码风格严格校验、写单测以及e2e自动化测试，对代码安全性校验。但无论怎样，最终的选取方案就两种要么容器化部署，要么非容器化部署。而针对于每一种方式，不同的团队根据业务要求和技术要求都会碰到不同的问题，重点是碰到问题、探索问题、解决问题的过程。如果你的团队是一个初创小团队，或者是你想单独一个人做一个项目，那么这篇文章应该能够告诉你研发流程的构建发布阶段里能够做的事情，并由此抛砖引玉给你更多的适合你团队的方案启发。如果你的团队是一个大型团队，那我想你的团队早就已经有了成熟的方案，或者一个适配于整个公司团队的完整的CI平台，那这篇文章也能告诉你当年你所在团队还是一个小团队时，他们也许也经历过这样的阶段，当时的解决方案也许跟我们的类似，只不过随着团队发展CI方案越来越成熟。总之，还是那句话：在合适的场景里应用到的方案就是最好的方案。
