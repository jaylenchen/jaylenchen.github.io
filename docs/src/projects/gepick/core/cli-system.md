---
publish: true
date: 2025/1/04 11:00
title: CLI System Design
project: gepick
tags:
 - design
---

# CLI System Design

![img](/projects/gepick/core/cli-system.png)

我们希望设计这样一个CLI系统，CLI只有一条命令，就是启动App。但是CLI可以有多种option配置，通过CLI Contribution，我们可以向CLI贡献其他模块希望提供的options，CLI能够收集这些Contritbution，以此来扩展CLI的options。在CLI运行期间，各Contribution能够处理自己的arguments，根据这些arguments来提供具体的功能。

这样一来，我们就给各种功能系统提供了“CLI options的配置”和“CLI arguments的处理”的扩展框架。一个功能系统如果希望提供自己的options，就实现一个CLI Contribution然后注册到IOC中。这样子我们就可以在命令行当中使用这些options了。

## CLI Contribution

我们希望通过各功能系统朝CLI系统做贡献的方式来扩展CLI系统的相关功能，因此我们设计了`Cli Contribution`。

- 定义`ICliContribution`接口，接口提供两个`API`，分别是定义`options`的`defineOptions API`和处理`arguments`的`processArguments API`。

- 定义`ICliContributionProvider`接口，它用来收集所有`Cli Contribution`。

  ```ts
  export interface ICliContribution {
    defineOptions(conf: yargs.Argv): void;
    processArguments(args: yargs.Arguments): MaybePromise<void>;
  }
  export type ICliContributionProvider = IContributionProvider<ICliContribution>;
  ```

- 定义`Cli Contribution`的访问服务标识符。

  ```ts
  export const [ICliContribution, ICliContributionProvider] = createContribution("CliContribution");
  ```

  接下来我们就能够在Cli当中通过`ICliContributionProvider`访问标识注入`CliContributionProvider`，并通过`CliContributionProvider.getContributions()`来获取所有注册的`Cli Contribution`。

- 定义`AbstractCliContribution`抽象类，所有`Cli Contribution`必须要继承这个基类，以此来成为一个有意义的`Contribution`。

  ```ts
  @Contribution(ICliContribution)
  export abstract class AbstractCliContribution extends AbstractService implements ICliContribution {
    abstract defineOptions(conf: yargs.Argv): void;
  
    abstract processArguments(args: yargs.Arguments): MaybePromise<void>;
  }
  ```

## CLI  Service

为了应用收集到的`Cli Contribution`，同时也为了执行CLI的主逻辑，我们设计了`CliService`。它本身也是一个需要注册到IOC的服务。

```ts
export interface ICliServiceOptions {
  /**
   * 在所有Cli Contribution解析完选项实际传入的参数值后调用
   */
  postProcessArguments: () => Promise<void>;
  /**
   * 默认命令
   */
  defaultCommand: () => Promise<void>;
}

export class CliService extends AbstractService {
  constructor(
    @ICliContributionProvider protected readonly cliContributionsProvider: ICliContributionProvider,
  ) {
    super();
  }

  async initCli(argv: string[], options: ICliServiceOptions): Promise<void> {
    const command = yargs(argv, process.cwd());
    const contribs = this.cliContributionsProvider.getContributions();
    
    for (const contrib of contribs) {
      contrib.defineOptions(command);
    }
    
    command
      .middleware(async (args) => {
        for (const contrib of contribs) {
          await contrib.processArguments(args);
        }
        await options.postProcessArguments();
      })
      .command('$0', false, () => {}, options.defaultCommand)
      .parse();
  }
}
```

`CliService`有一个`initCli`的核心方法，它用来启动CLI服务。我们通过`yargs`来实现CLI服务。

```ts
const command = yargs(argv, process.cwd());
```

上面这段代码实现了CLI。

```ts
 const contribs = this.cliContributionsProvider.getContributions();
    
 for (const contrib of contribs) {
      contrib.defineOptions(command);
 }
```

上面这段代码，通过`cliContributionsProvider`收集了所有`Cli Contribution`。并通过`contrib.defineOptions(command)`往CLI当中定义各功能的`Cli Contribution`提供的options。

```ts
command
.middleware(async (args) => {
	for (const contrib of contribs) {
     await contrib.processArguments(args);
  }
  await options.postProcessArguments();
})
```

上面这段代码，通过`middleware`定义了一个CLI中间件，它的参数`args`就是CLI运行时在命令行实际传递的参数。各功能的`Cli Contribution`从命令行传递过来的实参`args`当中选出自己能够处理的`argument`进行解析处理。

```ts
.command('$0', false, () => {}, options.defaultCommand)
.parse();
```

上面这段代码意思是定义一条默认命令，当用户没有指定子命令时执行这条命令，而`options.defaultCommand`就是要执行的默认命令逻辑。而`defaultCommand`定义如下：

```ts
async () => {
	const result = await container.get<IApp>(IApp).start(port, host);
  resolve(result);
}                
```

它其实就做了一件事：启动App。

## 应用CLI系统的流程

- 定义功能的`Cli Contribution`及其服务访问标识符。我们以`AppCliContribution`为例：

  ```ts
  export class AppCliContribution extends AbstractCliContribution {
    port:number;
    hostname:string;
    ssl: boolean | undefined
    cert: string | undefined
    certKey: string | undefined
    
    
      defineOptions(conf: yargs.Argv): void {
      conf.option('port', { alias: 'p', description: 'The port the backend server listens on.', type: 'number', default: DEFAULT_PORT });
      conf.option('hostname', { alias: 'h', description: 'The allowed hostname for connections.', type: 'string', default: DEFAULT_HOST });
      conf.option('ssl', { description: 'Use SSL (HTTPS), cert and certkey must also be set', type: 'boolean', default: DEFAULT_SSL });
      conf.option('cert', { description: 'Path to SSL certificate.', type: 'string' });
      conf.option('certkey', { description: 'Path to SSL certificate key.', type: 'string' });
    }
    
     processArguments(args: yargs.Arguments): void {
      this.port = args.port;
      this.hostname = args.hostname;
      this.ssl = args.ssl;
      this.cert = args.cert;
      this.certkey = args.certkey;
    }
  }
  
  
  export const IAppCliContribution = createServiceIdentifier<IAppCliContribution>("AppCliContribution");
  export type IAppCliContribution = AppCliContribution;
  ```

  我们实现了`App`功能系统需要提供的`Cli Contribution`，它代表了这个功能系统能够处理的`Cli Options`有哪些。在其他服务当中，你可以直接使用`IAppCliContribution`服务访问标识注入`appCliContribution`服务来访问到命令行实际传入的参数。比如你可以用像下面这么使用：

  ```ts
  class App extends AbstractService {
    constructor(
      @IAppCliContribution protected readonly cliParams: IAppCliContribution
    ) {
      super()
    }
    
    start() {
      const hostname = cliParams.hostname;
      const port = cliParams.port;
      
      console.log(`app is running in ${hostname}:${port}!`);
    }
  }
  ```

- 将功能定义的`AppCliContribution`加入到`Service Module`当中，注册为服务。

  ```ts
  @Module({
    services: [AppCliContribution]
  })
  class AppModule extends ServiceModule {}
  ```

- 在执行入口`main`中实现启动逻辑

  ```ts
  async function main() {
    const container = new ServiceContainer({ modules: [AppModule]});
    const cliService = container.get<ICliService>(ICliService);
    const argv = process.argv;
    const cliService = container.get<ICliService>(ICliService);
    
     cliService
       .initCli(argv.slice(2), {
           postProcessArguments: async () => {},
           defaultCommand: async () => {
               const result = await container.get<IApp>(IApp).start(port, host);
               resolve(result);
           }
       })
  }
  
  main()
  ```

- 命令行执行`main`，并传入配置参数。

  ```shell
  node './dist/main.js' --hostname localhost  --port 3000
  ```

​	这里可以看出应用了`app cli contribution`提供的`options`（`hostname`和`port`）。