---
publish: true
date: 2025/4/04 17:00
title: IPCChannel的设计与实现
project: gepick
tags:
 - design
---

# IPCChannel的设计与实现

这是一个专门用于在两个进程之间发送消息，使用专用的管道/文件描述符来传输二进制消息的Channel。

## 实现收消息的能力

需求：我们希望调用方能够使用`channel.onMessage((readBufferProvider) => {...})`就能够接收到对端发送来的消息。

对于所有的`Channel`，都有着一个属性`onMessage Emitter`，它是实现收消息能力的关键。在`Channel`的外部使用`onMessage`就能够接收到对端发送来的消息，而在`Channel`的内部使用`onMessageEmitter.fire(msg)`在合适的时机将对端消息派发出去。

在`IPCChannel`中，这个时机就是`binaryMessagePipe.onMessage(msg => ....)`，我们监听`binaryMessagePipe`的`onMessage`，它接收一个消息处理函数`(msg:string) => void`。在这里，我们将消息通过`onMessageEmitter.fire(msg)`派发出去，完成`IPCChannel`收消息的能力。我们的实现如下：

```ts
constructor() {
    this.messagePipe.onMessage(message => {
        this.onMessageEmitter.fire(() => new Uint8ArrayReadBuffer(message));
    });
}
```

## 实现发消息的能力

需求：我们希望调用方能够通过下面代码来发消息给对端。

```ts
const writeBuffer = channel.getWriteBuffer();

msgDecoder.request(writeBuffer, method, args);
writeBuffer.commit();
```

对于所有的`Channel`，都有着一个方法`getWriteBuffer`，它是实现发消息能力的关键。当调用方使用`writeBuffer.commit`的时候，消息就能够进入传输通道了。在`IPCChannel`的内部，为了让`commit`生效，我们在提供`writeBuffer`的时候，让其通过`writeBuffer.onCommit(msg => {...})`监听外部调用`commit`的操作。一旦`writeBuffer.commit`，就会触发`writeBuffer.onCommit`事件，这就是发消息的时机，我们接收到了即将发送给对端的消息，这这个时候通过`binaryMessagePipe.send(msg)`将消息发送给对端。我们的实现如下：

```ts
getWriteBuffer(): WriteBuffer {
    const result = new Uint8ArrayWriteBuffer();
    result.onCommit(buffer => {
        this.messagePipe.send(buffer);
    });

    return result;
}
```

## BinaryMessagePipe

无论在收消息和发消息的实现当中，我们发现都用到了同一个组件`BinaryMessagePipe`。在实现`IPCChannel`的收消息能力时，用到了`binaryMessagePipe.onMessage`来辅助实现`IPCChannel.onMessage`收消息。在实现`IPCChannel`的发消息能力时，用到了`binaryMessagePipe.send`来辅助实现`wirteBuffer.onCommit(msg => ...)`在接收到本地要发给对端的消息后，将消息发送给对端。

我们在构造`IPCChannel`的时候，对`BinaryMessagePipe`进行了实例化：

```ts
class IPCChannel extends AbstractChannel { 
    constructor(childProcess?: cp.ChildProcess) {
        super();
        if (childProcess) {
            this.setupChildProcess(childProcess);  // 父进程视角：实例化到子进程的管道 （父进程 → 子进程 的管道）
        } else {
            this.setupProcess(); // 子进程视角：实例化到父进程的管道 （子进程 → 父进程 的管道）
        }
    }
  
  
    protected setupChildProcess(childProcess: cp.ChildProcess): void {
        this.messagePipe = new BinaryMessagePipe(childProcess.stdio[4] as Duplex);
    }
  
    protected setupProcess(): void {
        this.messagePipe = new BinaryMessagePipe(new Socket({ fd: 4 }));
    }
}
```

上面这段代码的意思是：根据`childProcess`是否存在，选择`setupChildProcess`还是`setupProcess`来完成`BinaryMessagePipe`的构造。无论是在父进程中创建到子进程的`BinaryMessagePipe`时的实例化参数`childProcess.stdio[4]`，还是子进程中创建到父进程的`BinaryMessagePipe`时的实例化参数`new Socket({ fd: 4 })`，都是选用了5号管道作为通信管道。为啥选用5号管道的理由是，前4个管道都被标准用途使用，设计第5个管道就是专门用于二进制消息的传输的。

```ts
// 前4个管道被标准用途占用
stdio[0] // stdin - 标准输入
stdio[1] // stdout - 标准输出  
stdio[2] // stderr - 标准错误
stdio[3] // IPC - 进程间通信
// 第5个管道专门用于二进制消息
stdio[4] // 二进制消息管道 - 不与其他功能冲突
```

将5号管道用来进行二进制消息的传输，能够让前4个管道用在标准用途，不会阻塞标准IO，让二进制消息和标准IO完全分离开来。

从数据结构设计角度看，`BinaryMessagePipe`无非是将底层管道`childProcess.stdio[4]`和`new Socket({ fd: 4 })`统一包装，屏蔽了底层管道的差异性，对上层使用提供了一致的接口。

没有`BinaryMessagePipe`，在实现`IPCChannel`我们就需要每一处需要使用的地方进行条件判断，比如初始化和监听消息时：

```ts
 if (childProcess) {
    // 父进程：使用 childProcess.stdio[4]
    this.underlyingPipe = childProcess.stdio[4] as Duplex;
  } else {
    // 子进程：使用 process.stdin 或其他方式
    this.underlyingPipe = new Socket({ fd: 4 });
 }

 this.underlyingPipe.on('data', this.handleData.bind(this));
```

不仅如此，我们还需要`BinaryMessagePipe`在内部对消息进行相关复杂处理（消息边界处理、编码解码、错误处理）。这就是设计`BinaryMessagePipe`这个结构的基本意图：屏蔽底层管道差异性，分离职责封装复杂的消息处理操作，对外提供统一使用接口。