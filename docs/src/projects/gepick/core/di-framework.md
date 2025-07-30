---
publish: true
date: 2025/7/30 13:00
title: 基于InversifyJS的服务基础框架
project: gepick
tags:
 - design
---

# 基于InversifyJS的服务基础框架

## 引言

在开发Gepick时，我选择了 InversifyJS 作为依赖注入框架。为了更加统一服务的开发方式和注册方式，基于 InversifyJS，我开发了一套增强框架大幅简化了开发体验。客户端、服务端的实现都共用同一套服务基础系统。

## 服务访问

为了开发方便，我简化了服务的访问。你只需要创建服务访问标识，就可以直接利用服务访问标识直接访问对应服务。

```ts
export interface ILogger {
  log(...args:any[]):void;
}
export const ILogger = createServiceIdentifier<ILogger>("Logger")

export class Logger extends AbstractService implements ILogger {
  log(...args:any):void {
    console.log(...args);
  }
}

export class App extends AbstractService {
  constructor(
    @ILogger protected readonly logger: ILogger
  ) {
    super()
  }
  
  start() {
    this.logger.log("app start");
  }
}
```

上面这段代码定义了一个`Logger`，为了访问这个logger服务，我通过` createServiceIdentifier<ILogger>("Logger")`定义了服务的访问标识符`ILogger`。

接下来你只需要往容器中注册`Logger`，就能够在其他服务当中使用它。比如，在这个例子当中，我在`App`当中通过`ILogger`注入logger服务并使用它。

在Gepick当中，根据实际情况和Inversifyjs的对应使用，我目前设计了三种服务访问标识符创建API：

| API                                                          | 效果                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| `createServiceIdentifier<T>(serviceName: string ,symbol): ServiceIdentifier<T> ` | 创建默认的服务访问标识。如果服务没注册，使用它会抛出错误。   |
| `createOptionalServiceIdentifier<T>(serviceName: string,symbol): ServiceIdentifier<T>` | 创建一个可选的服务访问标识。如果服务没注册，使用它不会抛出错误，经典案例：所有`IContributionProvider`的访问标识都是它创建的。 |
| `createNamedServiceIdentifier<T>(serviceName: string,symbol): ServiceUtil.ServiceIdentifierOverload<T>` | 创建一个可带名字的服务访问标识。经典案例：`ILogger`的使用，可以用`@ILogger`，也可以用`@ILogger("App")`。 |



## 服务标识

我提供了一个`AbstractService`抽象类替换了inversifyjs的`@injectable`来替代标识某个服务成为一个可注入的服务，同时它还是一个带有生命周期的服务。

```ts
export interface ILogger {
  log(...args:any[]):void;
}
export const ILogger = createServiceIdentifier<ILogger>("Logger")

export class Logger extends AbstractService implements ILogger {
  log(...args:any):void {
    console.log(...args);
  }
}

export class App extends AbstractService {
  protected readonly _onAppStart = this._register(new Emitter<void>());
  public readonly onAppStart = this._onAppStart.event;
  
  constructor(
    @ILogger protected readonly logger: ILogger
  ) {
    super()
  }
  
  start() {
    this.logger.log("app start");
  }
  
  stop() {
    this.dispose();
  }
}
```

还是以logger服务为例子，上面这段代码通过`Logger extends AbstractService`，让`Logger`成为一个可注入的服务。接下来你只需要往容器中注册`Logger`，就能够在其他服务当中使用`Logger`。比如，在这个例子当中，我在`App`当中通过`ILogger`注入logger服务并使用它。

Gepick中的服务是具有生命周期的，`protected readonly _onAppStart = this._register(new Emitter<void>())`，我通过`_register`API将事件注册到析构容器当中。我定义了app停止的逻辑：`stop() { this.dispose() }`，在app停止的时候我可以通过`app.stop()`将析构容器释放，它是通过`AbstractService`提供的`dispose`析构函数实现的。

## 服务注册

我统一了服务的注册方式，为了注册一组服务，我提供了`AbstractModule`抽象类，一组希望注册到容器中的服务，可以通过实现一个具体子类继承`AbstractModule`，并使用`Module`装饰器定义需要注册的服务。

```ts
export interface ILogger {
  log(...args:any[]):void;
}
export const ILogger = createServiceIdentifier<ILogger>("Logger");
export class Logger extends AbstractService implements ILogger {
  log(...args:any):void {
    console.log(...args);
  }
}

export interface IApp {
  start():void
}
export const IApp = createServiceIdentifier<IApp>("App");
export class App extends AbstractService {
  constructor(
    @ILogger protected readonly logger: ILogger
  ) {
    super()
  }
  
  start() {
    this.logger.log("app start");
  }
}

@Module({ services:[ Logger, App ] })
export class CoreModule extends AbstractModule {}

export const container = new ServiceContainer({ modules: [CoreModule]});

container.get<IApp>(IApp).start();
```

上面这段代码，我通过`class CoreModule extends AbstractModule`定义了一个服务模块，然后通过`@Module({ services:[ Logger, App ] })`定义了需要注册到容器中的服务。最后我通过`const container = new ServiceContainer({ modules: [CoreModule]})`将服务模块加载到容器当中，服务就正式注册完毕了。接下来我就可以使用服务，`container.get<IApp>(IApp)`就是我提供的第二种服务获取方式。因此你不仅可以通过直接使用访问标识符在类中注入服务，也可以通过IOC容器直接获取服务。

## 服务容器

所有服务都需要注册到IOC容器当中进行管理，Gepick针对Inversifyjs的Container进行了部分改造。

```ts
@Module({ services:[ Logger, App ] })
export class CoreModule extends AbstractModule {}

@Module({ service: [ PluginService ] })
export class PluginModule extends AbstractModule {}

export class WebSocketEnpoint extends AbstractService {}
export IWebSocketEnpoint = WebSocketEnpoint;
export const IWebSocketEnpoint = createServiceIdentifier<IWebSocketEnpoint>("WebSocketEnpoint")

export const container = new ServiceContainer({ modules: [CoreModule]});
container.load(PluginModule)
container.bind<IWebSocketEnpoint>(IWebSocketEnpoint).to(WebSocketEnpoint)
```

上面这段代码中，我通过`new ServiceContainer({ modules: [CoreModule]})`定义了一个新的IOC容器，它接收的选项相比较Inversifyjs多了一个`modules`选项。如果你需要加载一组服务，那么你可以通过初始化容器的时候使用`modules`选项。比如这个例子，你也可以在实例化IOC容器后，通过`container.load(PluginModule)`来完成服务模块的注册。或者你可以直接通过`container.bind<IWebSocketEnpoint>(IWebSocketEnpoint).to(WebSocketEnpoint)`来注册单独的服务。

### 服务子容器（层级结构）

像一些应用场景，我需要创建服务子容器来进行服务隔离。比如：不同的浏览器Tab打开AI服务，我应该针对每一个连接Connection实现一套Connection Scope级别的服务。每个Connection都对应着一套相互隔离的服务，但这些服务的实现都是一样的，除此之外的其他服务应该是共享的。如何实现这个服务隔离需求呢？其实服务子容器的设计实现就能够有效地实现这个需求。对于需要隔离的服务就组成一个服务模块，然后让子容器分别加载这个服务模块，而不需要隔离的服务都是共享的服务，得益于Inversifyjs的设计，子容器天然可以共享来自父容器的服务，如此一来需求得以实现。

我同样对`createChild`API做了改造，它也多出来一个`modules`选项。

```ts
// #region 共享服务
export const ILogger = createServiceIdentifier<ILogger>("Logger");
class Logger extends AbstractService {}

@Module({ services: [Logger] });
class CommonModule extends AbstractModule {}
// #endregion

// #region connection scope级别服务
export const IAIChat = createServiceIdentifier<IAIChat>("AIChat");
class AIChat extends AbstractService {
  private _usage = 0;
 
  constructor(
    @ILogger protected logger: ILogger
  ) {
    super();
  }
  
  get usage() { this.logger.log(this._usage) }
  set usage(v: number) { this._usage = v }
  
}

@Module({services: [AIChat] })
class AIModule extends AbstractModule {}
// #endregion

// #region 服务注册 + 使用服务
const root = new ServiceContainer({ modules: [CommonModule] });
const child1 = root.createChild({ modules: [AIModule] }) 
const child2 = root.createChild({ modules: [AIModule] })


const childAIChat1 = child1.get<IAIChat>(IAIChat);
const childAIChat2 = child2.get<IAIChat>(IAIChat);

childAIChat1.usage; // 0
childAIChat2.usage; // 0

childAIChat1.usage = 1;
childAIChat2.usage = 2;

childAIChat1.usage; // 1
childAIChat2.usage; // 2
// # endregion
```

如上示例，我实现了一个简单的服务隔离。子容器`child1`和`child2`都有自己的`AIChat`服务，实现相同，却又是相互隔离的。同时它们又共享着root容器的logger服务。

```ts
// #region 共享服务
export const ILogger = createServiceIdentifier<ILogger>("Logger");
class Logger extends AbstractService {}

@Module({ services: [Logger] });
class CommonModule extends AbstractModule {}
// #endregion
```

上面这段代码定义了一个共享的服务模块`CommonModule`，共享的服务有`Logger`。我希望这个模块内的服务都是子容器共享的。

```ts
// #region connection scope级别服务
export const IAIChat = createServiceIdentifier<IAIChat>("AIChat");
class AIChat extends AbstractService {
  private _usage = 0;
 
  constructor(
    @ILogger protected logger: ILogger
  ) {
    super();
  }
  
  get usage() { this.logger.log(this._usage) }
  set usage(v: number) { this._usage = v }
  
}

@Module({services: [AIChat] })
class AIModule extends AbstractModule {}
// #endregion
```

上面这段代码定义了一个`connection scope`级别的服务模块`AIModule`，针对不同的子容器，会使用自己的服务列表，每个`connection`就对应着一个子容器。你可以将`connection`看成在浏览器打开了一个新的Tab标签加载同样一个项目。

```ts
// #region 服务注册 + 使用服务
const root = new ServiceContainer({ modules: [CommonModule] });
const child1 = root.createChild({ modules: [AIModule] }) 
const child2 = root.createChild({ modules: [AIModule] })
// # endregion
```

上面这段代码，我创建了一个根容器`root`，并加载了共同的服务模块`CommonModule`。接着，我假设有2个`connection`，分别对应着`child1`和`child2`。我让它们分别加载`AIModule`。然后我假设正在使用两个浏览器Tab使用项目：

```ts
const childAIChat1 = child1.get<IAIChat>(IAIChat);
const childAIChat2 = child2.get<IAIChat>(IAIChat);

childAIChat1.usage; // 0
childAIChat2.usage; // 0

childAIChat1.usage = 1;
childAIChat2.usage = 2;

childAIChat1.usage; // 1
childAIChat2.usage; // 2
```

`childAIChat1.usage`和`childAIChat2.usage`会打印出当前的token使用，这里应该是0。因为我在实现`AIChat`内部有`get usage() { this.logger.log(this._usage) }`这样一段代码定义了这段逻辑。然后我模拟浏览器Tab使用AI服务，让`childAIChat1.usage = 1`和`childAIChat2.usage = 2`。最后我再次打印两个容器中对应`AIChat`里头`usage`的使用情况，`childAIChat1.usage`和`childAIChat2.usage`。可以看到输出分别是1和2。

如此，我可以做到服务的隔离效果。最后，我用一段项目注释说明实际应用：

```ts
/**
 * 有的时候，我需要动态创建模块，然后将其加载到容器中。这种场景下，我一样可以使用Contribution来实现这种功能。
 * 我通过createContribution来创建一个Contribution，再通过定义一个抽象类标记Contribution的实现类。接下来我分两步走：
 * - 实现具体的Contribution，来完成Module的创建逻辑
 * - 在需要这些贡献的Module的地方，通过IConnectionContainerModuleContributionProvider来获取所有Contribution，进而通过调用createModule来创建Module。这样一来，我就能够得到一组Module。
 * 接下来，你可以创建一个个子容器，分别加载这些Module，并获取其中的服务。通过这种操作，我让不同的容器之间都有同样的模块，但是又互不干扰，做到了模块的复用和隔离，这在实现支持多租户架构的系统时非常有用。
 *
 * 这种操作可以允许我实现如下场景：
 * - 多租户隔离：每个前端连接都有自己独立的服务实例
 * - 状态隔离：不同用户/连接之间的状态不会相互干扰
 *
 * 对于一些功能我就需要用到连接级别的模块，每个连接对应着一个子容器，每个子容器都能通过IConnectionScopeModuleContributionProvider来获取到一组模块贡献。
 * 虽然每个子容器都有同样的模块，但是它们之间是隔离的，互不干扰。
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                        总容器 (Root Container)                    │
 * │                                                                 │
 * │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
 * │  │   Connection A  │  │   Connection B  │  │   Connection C  │  │
 * │  │   子容器 A      │  │   子容器 B      │  │   子容器 C      │  │
 * │  │                 │  │                 │  │                 │  │
 * │  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │
 * │  │ │  服务 A     │ │  │ │  服务 A     │ │  │ │  服务 A     │ │  │
 * │  │ │ (实例 A1)   │ │  │ │ (实例 A2)   │ │  │ │ (实例 A3)   │ │  │
 * │  │ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │  │
 * │  │                 │  │                 │  │                 │  │
 * │  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │
 * │  │ │  服务 B     │ │  │ │  服务 B     │ │  │ │  服务 B     │ │  │
 * │  │ │ (实例 B1)   │ │  │ │ (实例 B2)   │ │  │ │ (实例 B3)   │ │  │
 * │  │ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │  │
 * │  │                 │  │                 │  │                 │  │
 * │  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │
 * │  │ │  服务 C     │ │  │ │  服务 C     │ │  │ │  服务 C     │ │  │
 * │  │ │ (实例 C1)   │ │  │ │ (实例 C2)   │ │  │ │ (实例 C3)   │ │  │
 * │  │ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │  │
 * │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
 * │                                                                 │
 * │  ┌─────────────────────────────────────────────────────────────┐ │
 * │  │                    共享服务层                                │ │
 * │  │                                                             │ │
 * │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │ │
 * │  │  │  共享服务1  │  │  共享服务2  │  │  共享服务3  │         │ │
 * │  │  │ (单例)      │  │ (单例)      │  │ (单例)      │         │ │
 * │  │  └─────────────┘  └─────────────┘  └─────────────┘         │ │
 * │  └─────────────────────────────────────────────────────────────┘ │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * 连接关系：
 * ├── 总容器 → Connection A → 子容器 A
 * ├── 总容器 → Connection B → 子容器 B
 * ├── 总容器 → Connection C → 子容器 C
 * └── 所有子容器 → 共享服务层 (依赖注入)
 *
 * 服务类型：
 * - 子容器服务：A、B、C (每个子容器独立实例)
 * - 共享服务：1、2、3 (所有子容器共享单例)
 */
```

## Contribution机制

在实际的工程当中，很多服务都是可扩展的。比如一个CLI基础系统，我不太可能一次性就将所有options定义完，因为随着项目功能增加，不同的功能系统都有可能往CLI基础系统添加自己功能的options。这就需要我实现一个动态收集options的可扩展机制，这个机制就叫做Contribution机制。

通过Contribution机制，一个基础系统只需要实现自己的核心基础功能，然后定义出对应的Contribution扩展点，就可以在合适的时机将所有Contribution收集起来，将这些Contribution拿出来解析使用。

```ts
export const [ICliContribution, ICliContributionProvider] = createContribution("CliContribution");

export interface ICliContribution {
  defineOptions(conf: yargs.Argv): void;
  processArguments(args: yargs.Arguments): MaybePromise<void>;
}
export type ICliContributionProvider = IContributionProvider<ICliContribution>;

@Contribution(ICliContribution)
export abstract class AbstractCliContribution extends AbstractService implements ICliContribution {
  abstract defineOptions(conf: yargs.Argv): void;

  abstract processArguments(args: yargs.Arguments): MaybePromise<void>;
}
```

上面这段代码，通过`const [ICliContribution, ICliContributionProvider] = createContribution("CliContribution")`定义了一个新的Contribution。它返回了两个变量，变量`ICliContribution`代表`CliContribution`的访问标识符，变量`ICliContributionProvider`代表`CliContritbuion`的服务列表访问标识符。

```ts
@Contribution(ICliContribution)
export abstract class AbstractCliContribution extends AbstractService {}
```

上面这段代码，我通过`AbstractCliContribution extends AbstractService `设计了一个抽象类，并通过`@Contribution(ICliContribution)`将它标识为`CliContribution`。这样一来，所有的`CliContribution`只需要继承`AbstractCliContribution`，并实现相关的方法就能够完成一个`CliContribution`的实现。最后同样地，你只需要将具体的`CliContribution`注册到IOC容器中就可以在需要收集`CliContribution`的地方使用`ICliContributionProvider`来获取所有`CliContribution`并使用了。

```ts
export class CliService extends AbstractService {
  constructor(
    @ICliContributionProvider protected readonly cliContributionsProvider: ICliContributionProvider,
  ) {
    super();
  }

  async initCli(argv: string[], options: ICliServiceOptions): Promise<void> {
    const command = yargs(argv, process.cwd());

    const contribs = this.cliContributionsProvider.getContributions();
    // 配置选项
    for (const contrib of contribs) {
      contrib.defineOptions(command);
    }
    command
      .middleware(async (args) => {
        // 解析选项实际传入的参数值
        for (const contrib of contribs) {
          await contrib.processArguments(args);
        }
        await options.postProcessArguments();
      })
      .command('$0', false, () => {}, options.defaultCommand)
      .parse();
}
```

上面这段代码，`@ICliContributionProvider protected readonly cliContributionsProvider: ICliContributionProvider`注入了`CliContribution`的`Contribution Provider`，它是用来收集所有`CliContribution`的。我通过`this.cliContributionsProvider.getContributions()`收集所有的`Contribution`。每个`Contrbution`都有对应的`defineOptions`和`processArguments`，分别负责自己功能”选项的定义“和”选项的解析“。如果你希望更详细地了解CLI基础系统的具体设计实现，你可以参考我的相关文章。

## 服务装饰器

为了能够更好地使用服务，我实现了一套装饰器，它对应着大部分Inversifyjs里头的[binding syntax](https://inversify.io/docs/6.x/api/binding-syntax/)规则。

| BindToSyntax       | *BindInSyntax*      | *BindOnSyntax*    | *BindWhenSyntax* |
| :----------------- | :------------------ | :---------------- | :--------------- |
| `@ToConstantValue` | `@InSingletonScope` | `@OnActivation`   | `@When`          |
| `@ToDynamicValue`  | `@InTransientScope` | `@OnDeactivation` |                  |
| `@ToFactory`       | `@InRequestScope`   |                   |                  |
| `@ToProvider`      |                     |                   |                  |

- **BindToSyntax**

  ```ts
  export class TestDynamicValue extends AbstractService {
    
    @ToDynamicValue()
    toDynamicValue({ container }: { container: IServiceContainer }) {
      return {
        command1: 'testcommand1',
        commandRegistry: container.get(ICommandRegistry),
      };
    }
  }
  
  export const ITestDynamicValue = createServiceIdentifier<ITestDynamicValue>(TestDynamicValue.name);
  export interface ITestDynamicValue {
    command1: string;
    commandRegistry: ICommandRegistry;
  }
  ```

  上面这段代码，通过`@ToDynamicValue()`将整个服务变成一个动态定制的服务，当你使用`ITestDynamicValue`访问服务时，实际上访问的是

  ```ts
  {
        command1: 'testcommand1',
        commandRegistry: container.get(ICommandRegistry),
  }
  ```

  因此你的服务类型也需要做下调整

  ```ts
  interface ITestDynamicValue {
    command1: string;
    commandRegistry: ICommandRegistry;
  }
  ```

- **BindInSyntax**

  ```ts
  @InTransientScope()
  export class TestTransientScope extends AbstractService {}
  ```

  服务默认设计跟Inversifyjs不同，我将其设计成默认是`Singleton`级别，因此如果你需要修改服务的作用域，你可以使用作用域装饰器来修改。比如这里，我们使用`@InTransientScope()`将服务改成了`Transient Scope`。

- **BindOnSyntax**

  ```ts
  export type ITestOnActivation = TestOnActivation;
  export class TestOnActivation extends AbstractService {
    
    @OnActivation()
    onActivation(ctx: interfaces.Context, service: ITestOnActivation) {
      console.log("service active", service)
    }
  }
  ```

  Inversifyjs当中的`onActivation`的使用大致如下：

  ```ts
  bind(ILogger).to(Logger).onActivation((context, service) => {
          // do something...
          return service;
  });
  ```

  你需要时刻记得返回service，否则inversifyjs会给你提示一个错误。使用`@OnActivation`装饰器，就没有这个烦恼了，在内部实现其实就是劫持了inversifyjs原始的内容做了强制返回修改，其他使用方式都跟inversifyjs完全一样。

- **BindWhenSyntax**

  ```ts
  @When(request => getName(request) === undefined)
  export class DefaultLogger extends AbstractService {
    static override name = "Logger";
    log() {
      console.log("default logger");
    }
  }
  
  @When(request => getName(request) !== undefined)
  export class DynamicLogger extends AbstractService {
    static override name = "Logger";
  
    @ToDynamicValue()
    toDynamicValue({ container }: { container: IServiceContainer }) {
      return {
        log() {
          console.log("dynamic logger");
        },
      };
    }
  }
  
  
  
  function getName(request: interfaces.Request): string | undefined {
    const named = request.target.metadata.find(e => e.key === 'named');
    const result = named ? named.value?.toString() : undefined;
  
    return result;
  }
  ```

  条件返回在依赖注入当中是十分有用的。比如，设计一个具有层次结构的Logger基础系统，我们希望按照如下使用：

  ```ts
  class App extends AbstractService {
    constructor(
      @ILogger protected rootLogger: ILogger,
      @ILogger("App") protected appLogger: ILogger
    ) {
      super()
    }
  }
  ```

  上面这段代码，我们在`App`当中定义了两个`Logger`，我们希望当使用`@ILogger`的时候，使用`root`全局logger，使用`@ILogger("App")`的时候使用`App`模块级别的logger。如何在项目中实现这个需求？答案其实就是这个分节当中的第一段代码，我们可以通过使用`@When`装饰器来完成这个需求。

  ```ts
  function getName(request: interfaces.Request): string | undefined {
    const named = request.target.metadata.find(e => e.key === 'named');
    const result = named ? named.value?.toString() : undefined;
  
    return result;
  }
  ```

  上面这段代码的意思是找出这个依赖注入请求，是否使用了`@named()`装饰器，如果有返回传入`@named()`装饰器的那个名字，比如你使用`@named("App")`，`getName`的结果就是`App`，否则就是`undefined`。

  ```ts
  @When(request => getName(request) === undefined)
  export class DefaultLogger extends AbstractService {}
  
  @When(request => getName(request) !== undefined)
  export class DynamicLogger extends AbstractService {}
  ```

  上面的代码使用了`@When`装饰器，它们的意思是：如果依赖注入请求经过`getName`处理，获取的值是`undefined`，那么请你使用`DefaultLogger`这个实现，否则使用`DynamicLogger`这个实现，注意这两个类只不过是一个`Logger`定义的两种不同实现，我们用`static override name = "Logger"`标记了这个事实。因此你才可以使用`ILogger`来统一完成不同实现的服务注入。

  ## 总结

  这篇文章，我带你介绍了Gepick当中的服务注入框架，它是Gepick开发的基础核心，几乎所有服务的开发都是依赖这个框架。这篇文章会根据实际进行修改编辑，希望能够给使用inversifyjs的你带来一定的使用启发和二开思路。