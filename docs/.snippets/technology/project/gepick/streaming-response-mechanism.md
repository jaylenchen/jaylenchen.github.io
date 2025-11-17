## 前置技术

- RPC（整个项目的通讯基础是RPC，相关技术生态中RPC占着很重要的地位）

## 技术解析

- `for await (const token of AsyncIterable<T>)`

  stream流响应其实就是一个`AsyncIterable`类型的对象。在消费端，消费者通过`for await`来消费`AsyncIterable`，也就是stream。因此，要重建stream，本质上就似乎重新构建出`AsyncIterable`对象。而构建`AsyncIterable`对象的关键就是**实现一个async generator**

- `async generator`：实现async generator的关键是`while(true)` + `current`指针。具体的设计如下：

  通过`current`指针不断巡逻state的tokens是否有没用过的token存在：

  - 有token：查看当前token是否是结束标志：
    - 结束标志：退出循环
    - 非结束标志：弹出token
  - 无token：进入等待阶段

  

## 架构分层

- **模型适配层**：标准化language model的基本结构，包括请求的方式、响应的结构。

  这一层的主要职责是对接第三方llm provider，适配第三方llm的请求方式和响应结构。因此，我们可以在适配层之上，对接多个不同厂商的llm，厂商比如openai、google、anthropic、hugingface。

  我们给出`LanguageModel`最核心的结构定义：

  ```ts
  interface LanguageModel {
      readonly id: string;
      readonly name?: string;
      readonly vendor?: string;
      readonly version?: string;
      readonly family?: string;
      readonly maxInputTokens?: number;
      readonly maxOutputTokens?: number;
      readonly status: LanguageModelStatus;
     
      request(request: UserRequest, cancellationToken?: CancellationToken): Promise<LanguageModelResponse>;
  }
  ```

  所有的llm adapter都会实现`request -> LanguageModelResponse`，在实现response的时候都会实现:

  ```ts
  {
    stream: AsyncInterator<LanguageModelResponsePart>
  }
  ```

  其内部原理就是：先通过`for await `消费原生llm提供的`stream`。然后在判断stream的每个部分，到底是属于llm part的哪一个部分。然后将对应部分包装成具体的`LanguageModelResponsePart`，也就是`TextResponsePart | ToolCallResponsePart | ThinkingResponsePart | UsageResponsePart;`。

  而整个stream其实就是一个`AsyncIterator`，它的具体实现大致有三种方式：

  - 通过async generator实现

    ```ts
    const asyncIterator = {
      async *[Symbol.asyncIterator]():AsyncIterator<LanguageModelStreamResponsePart> {}
    } 
    ```

  - 通过迭代器模式手动实现

    ```ts
    class StreamingAsyncIterator implements AsyncIterableIterator<LanguageModelStreamResponsePart> {
      [Symbol.asyncIterator](): AsyncIterableIterator<LanguageModelStreamResponsePart> { return this; }
      
      next(): Promise<IterResult> {}
    }
    ```

    

- **响应转发层**：当后端获取到第三方llm对接层返回的response后，会消费response。具体的消费方式不断获取`response.stream`中的token。

  ```ts
      protected sendTokens(id: string, stream: AsyncIterable<LanguageModelStreamResponsePart>, cancellationToken?: CancellationToken): void {
          // 在后端启动异步IIFE（立即执行函数表达式），这样就能在后台持续发送token，不会阻塞主线程。
          (async () => {
              try {
                  // 流式响应：不断将stream中的token发送给frontend
                  // 🔑 调用前端的 send 方法
                  for await (const token of stream) {
                       // 推送每个 token 给前端
                       // 它代表前端接收流式响应的token，这又响应了设计结构的名字：Frontend Delegate。
                      this.frontendDelegateClient.send(id, token); // ← 调用前端
                  }
              } catch (e) {
                  if (!cancellationToken?.isCancellationRequested) {
                      // 🔑 调用前端的 error 方法
                      this.frontendDelegateClient.error(id, e);
                  }
              } finally {
                  // 流结束标记
                  this.frontendDelegateClient.send(id, undefined);
                  this.frontendDelegateClient.send(id, undefined);
              }
          })();
      }
  ```

  响应转发层，实际本身也是在消费llm返回来的response。具体是通过`for await (const token of stream)`的方式不断地消费stream产生的token。并通过`frontendDelegateClient.send(id, token)`转发给前端。

  注意到，`request`实际上是被前端通过rpc的方式调用起来的，在完成`request`的调用后，实际上前端获取到的响应只是一个response delegate对象：

  ```ts
  const delegate = {
    streamId: generateUuid()
  };
  ```

  这么做的原因是因为，我们无法将`AsyncIterable<T>`类型的对象直接转发给前端。因此，但是`delegate`这个结构是能够序列化发送给前端的。

  ⚠️因此，前端需要面临的一个问题是： **如何通过后端转发来的token以及streamId重建Asyiterable<T>的stream？**

- **响应消费层**：这一层在前端。现在前端通过`model.request`立马获得了`streamId`。同时后端还会将第三方llm响应的`stream`里头token一个个返回给前端。

  我们先看下前端部分`FrontendLanguageModelRegistryImpl`的调用逻辑：

  ```ts
  class FrontendLanguageModelRegistryImpl {
    createFrontendLanguageModel(
          description: LanguageModelMetaData
      ): LanguageModel {
            return {
              ...
              request(): Promise<LanguageModelResponse> {
              	...
              }
            }
          }
  }
  
  
  // request的具体逻辑
  const response = await this.providerDelegate.request(
    description.id,
    request,
    requestId,
    cancellationToken
  );
  
  
  if (isLanguageModelStreamResponseDelegate(response)) {
      if (!this.streams.has(response.streamId)) {
          const newStreamState = {
              id: response.streamId,
              tokens: [],
          };
          this.streams.set(response.streamId, newStreamState);
      }
      const streamState = this.streams.get(response.streamId)!;
      return {
          stream: this.getIterable(streamState),
      };
  }
  ```

  上面的代码意思是如果发现response是一个流式响应代理，则根据`streamState`重建`stream`，并返回给业务调用方。

  这里头就有必要讲下前端是如何重建stream的：`stream: this.getIterable(streamState)`。

  - 获取stream state(没有就创建):

    ```
    const newStreamState = {
      id: response.streamId,
      tokens: [],
    };
    ```

  - 基于stream state构建stream

    ```ts
     async *getIterable(
            state: StreamState
        ): AsyncIterable<LanguageModelStreamResponsePart> {
            let current = -1;
            while (true) {
                if (current < state.tokens.length - 1) {
                    current++;
                    const token = state.tokens[current];
                    if (token === undefined) {
                        // message is finished
                        break;
                    }
                    if (token !== undefined) {
                        yield token;
                    }
                } else {
                    await new Promise((resolve, reject) => {
                        state.resolve = resolve;
                        state.reject = reject;
                    });
                }
            }
            this.streams.delete(state.id);
    }
    ```

    通过while(true)无限循环和current指针的组合，我们不断通过`current < state.tokens.length - 1`来巡逻查看tokens中是否有可用的token：

    - 如果有token可用：我们将其取出，做进一步判断，
      - token为undefined，说明这是流结束的标志，我们打断循环，结束流式响应
      - token不为undefined，说明这是一个可用token，我们将其yield出去
    - 如果没有token可用：通过await promise将当前流程挂起，让state保存resolve和reject，等待state重新resolve或者reject让那个循环继续走下去。

    如此一来，就说明一定会有一个位置调用state.resolve(token)，让流程接着跑。这个位置就是同类中的方法send，它其实是被rpc调用的：

    ```ts
        // called by backend via the "delegate client" with new tokens
        // ════════════════════════════════════════════════════
        // 实现 2: send - 接收后端推送的流式响应
        // ════════════════════════════════════════════════════
        send(id: string, token: LanguageModelStreamResponsePart | undefined): void {
            if (!this.streams.has(id)) {
                const newStreamState = {
                    id,
                    tokens: [],
                };
                this.streams.set(id, newStreamState);
            }
            // 1. 找到对应的 stream
            const streamState = this.streams.get(id)!;
            // 2. 推送 token
            streamState.tokens.push(token);
            // 3. 唤醒等待的迭代器
            if (streamState.resolve) {
                streamState.resolve(token);
            }
        }
    ```

    这样一来交互时序就是：前端的stream消费者不断尝试消费stream中的token，一旦没有可消费的token了就挂起协程，而后端则不断通过rpc send token，然后通过streamState.resolve(token)生产token，唤醒挂起的协程，让前端接着消费stream。

- **应用请求层**：这一层是业务的实际应用层，它常常以各种Agent的形式存在，并请求llm获取响应。

  ##### Chat Agent

  我们先看下最接近AI Chat的结构Chat Agent的结构，它处于`ai-chat`当中：
  
  ```ts
  abstract class AbstractChatAgent implements ChatAgent {
        async invoke(request: MutableChatRequestModel): Promise<void> {
          try {
              const languageModel = await this.getLanguageModel(this.defaultLanguageModelPurpose);
              if (!languageModel) {
                  throw new Error('Couldn\'t find a matching language model. Please check your setup!');
              }
              // 获取system prompt
              const systemMessageDescription = await this.getSystemMessageDescription({ model: request.session, request } satisfies ChatSessionContext);
             // 获取history messages
              const messages = await this.getMessages(request.session);
  
              if (systemMessageDescription) {
                  const systemMsg: LanguageModelMessage = {
                      actor: 'system',
                      type: 'text',
                      text: systemMessageDescription.text
                  };
                  // insert system message at the beginning of the request messages
                  messages.unshift(systemMsg);
              }
  
              const systemMessageToolRequests = systemMessageDescription?.functionDescriptions?.values();
              const tools = [
                  ...this.chatToolRequestService.getChatToolRequests(request),
                  ...this.chatToolRequestService.toChatToolRequests(systemMessageToolRequests ? Array.from(systemMessageToolRequests) : [], request),
                  ...this.chatToolRequestService.toChatToolRequests(this.additionalToolRequests, request)
              ];
            
              // 发起llm rquest获取llm response
              const languageModelResponse = await this.sendLlmRequest(request, messages, tools, languageModel);
  						
            // 将llm response加入到响应内容的构建（此时应该可以对接AI Chat UI层）
              await this.addContentsToResponse(languageModelResponse, request);
              await this.onResponseComplete(request);
  
          } catch (e) {
              this.handleError(request, e);
          }
      }
    
       protected async sendLlmRequest(
          request: MutableChatRequestModel,
          messages: LanguageModelMessage[],
          toolRequests: ChatToolRequest[],
          languageModel: LanguageModel
      ): Promise<LanguageModelResponse> {
          const agentSettings = this.getLlmSettings();
          const settings = { ...agentSettings, ...request.session.settings };
          const dedupedTools = this.deduplicateTools(toolRequests);
          const tools = dedupedTools.length > 0 ? dedupedTools : undefined;
          return this.languageModelService.sendRequest(
              languageModel,
              {
                  messages,
                  tools,
                  settings,
                  agentId: this.id,
                  sessionId: request.session.id,
                  requestId: request.id,
                  cancellationToken: request.response.cancellationToken
              }
          );
      }
  }
  ```

  接着我们看下LanguageModelService的具体实现，它处于`ai-core`当中：
  
  ```ts
  class LanguageModelServiceImpl implements LanguageModelService {
      async sendRequest(
          languageModel: LanguageModel,
          languageModelRequest: UserRequest
      ): Promise<LanguageModelResponse> {
          // Filter messages based on client settings
          languageModelRequest.messages = languageModelRequest.messages.filter(message => {
              if (message.type === 'thinking' && languageModelRequest.clientSettings?.keepThinking === false) {
                  return false;
              }
              if ((message.type === 'tool_result' || message.type === 'tool_use') &&
                  languageModelRequest.clientSettings?.keepToolCalls === false) {
                  return false;
              }
              // Keep all other messages
              return true;
          });
  				
          // 因此
          let response = await languageModel.request(languageModelRequest, languageModelRequest.cancellationToken);
          let storedResponse: LanguageModelExchangeRequest['response'];
          if (isLanguageModelStreamResponse(response)) {
              const parts: LanguageModelStreamResponsePart[] = [];
              response = {
                  ...response,
                  stream: createLoggingAsyncIterable(response.stream,
                      parts,
                      () => this.sessionChangedEmitter.fire({ type: 'responseCompleted', requestId: languageModelRequest.subRequestId ?? languageModelRequest.requestId }))
              };
              storedResponse = { parts };
          } else {
              storedResponse = response;
          }
          this.storeRequest(languageModel, languageModelRequest, storedResponse);
  
          return response;
      }
  }
  ```

  对`ai-chat`中的chat-agents来说，它只需要知道调用`LanguageModelService.sendRequest`就能够发起llm请求获取llm响应。它不关心底层是如何实现的send request。实际上在这里头传递的LanguageModel只是后端创建的`LanguagelModel`的前端映射分身。因此，需要知道response的构成还是需要到具体的`LanguageModelRegistry`中查看前端部分是如何处理的。
  
  在前端，`LanguageModelRegistry`的实现实际上是`FrontendLanguageModelRegistryImpl`，这个位置实际上就是上面的**响应消费层**。
  
  我们接着专门设计了一个`AbstractStreamParsingChatAgent`继承自`AbstractChatAgent`，这个结构专门消费标准stream：
  
  ```ts
  export abstract class AbstractStreamParsingChatAgent extends AbstractChatAgent {
        protected override async addContentsToResponse(languageModelResponse: LanguageModelResponse, request: MutableChatRequestModel): Promise<void> {
          ... 
            if (isLanguageModelStreamResponse(languageModelResponse)) {
              await this.addStreamResponse(languageModelResponse, request);
              return;
          }
          ...
        }
  
        protected async addStreamResponse(languageModelResponse: LanguageModelStreamResponse, request: MutableChatRequestModel): Promise<void> {
          let completeTextBuffer = '';
          let startIndex = request.response.response.content.length;
          for await (const token of languageModelResponse.stream) {
              // Skip unknown tokens. For example OpenAI sends empty tokens around tool calls
              if (!isLanguageModelStreamResponsePart(token)) {
                  console.debug(`Unknown token: '${JSON.stringify(token)}'. Skipping`);
                  continue;
              }
              const newContent = this.parse(token, request);
              if (!isTextResponsePart(token)) {
                  // For non-text tokens (like tool calls), add them directly
                  if (isArray(newContent)) {
                      request.response.response.addContents(newContent);
                  } else {
                      request.response.response.addContent(newContent);
                  }
                  // And reset the marker index and the text buffer as we skip matching across non-text tokens
                  startIndex = request.response.response.content.length;
                  completeTextBuffer = '';
              } else {
                  // parse the entire text so far (since beginning of the stream or last non-text token)
                  // and replace the entire content with the currently parsed content parts
                  completeTextBuffer += token.content;
  
                  const parsedContents = this.parseContents(completeTextBuffer, request);
                  const contentBeforeMarker = startIndex > 0
                      ? request.response.response.content.slice(0, startIndex)
                      : [];
  
                  request.response.response.clearContent();
                  request.response.response.addContents(contentBeforeMarker);
                  request.response.response.addContents(parsedContents);
              }
          }
  }
  ```
  
  
  
  ##### Chat UI
  
- `chat-view-widget.tsx`：直接展示整个chat聊天窗口的组件，由聊天树视图（消息展示层） + 输入框视图（消息输入层）组成一个完整的聊天面板。

  - `chat-view-tree-widget.tsx`
  - `chat-input-widget.tsx`

- **Chat Service**

  UI层不关心调用什么agent，它主要关心如何做视图交互。因此，跟UI层对接的主要是`ChatService`，`ChatService`作为视图层与底层Agent之间的桥梁。UI层要保证实现出来是通用的组件，而不是跟某个单一聊天挂钩的实现。这一层的设计意图是“让 UI 成为 Theia AI 聊天体系的终端”，把会话管理、流式内容、工具调用等复杂逻辑都交给 ChatService+ChatModel，自己只负责展示和交互。

    因此，抓住核心入口`ChatService`，以此作为唯一后端入口。这样一来，`ChatViewWidget `负责把输入、树视图、状态控制（锁定、取消、滚动）整合，用 ChatService 作为唯一后端入口。这样输入框只管收集请求，树视图只管展示内容，逻辑清晰。

    在整个Chat View Widget中的核心就是初始化组件的时候，同时也创建了一个会话session：` this.chatSession = this.chatService.createSession();`。如果不调用 `chatService.createSession()`，这个 widget 就不会拿到 `ChatSession`/`ChatModel`：

    - 没有 `chatSession.model`，`treeWidget.trackChatModel(...)` 和 `inputWidget.chatModel = ...` 都没法执行，聊天记录、流式响应、上下文设置等通通无从谈起——UI 甚至无法渲染任何消息。
    - `onQuery`、`onCancel` 等操作都依赖 `chatSession.id` 和它的 pinned agent；没有 session 就无法把用户请求交给 `ChatService` 处理。
    - Theia 的聊天框架是 “Session → Model → UI” 的数据流。Session 是绑定 Agent、模型、上下文、请求/响应队列的载体。跳过这一步会让视图层完全失去数据和事件来源。

    所以 `createSession()` 是 UI 与整个聊天管线对接的前置条件，缺了它，界面既不能发送请求也无法显示任何响应。

## 核心思想

  - Node侧做LanguageMode的适配层，每个Model适配器对接时通过消费原生LLM的Response转换为适配层标准的`LanguageModelResponse`的stream（AsyncIterator）。
  - Node侧抽象出`Request-Response`的通用流程：
    - 直接返回`Response Delegate`给Browser。
    - 异步消费`Response`，它就是适配层标准的`LanguageModelResponse`，然后通过stream发送每个token。
  - Browser侧抽象出`Request-Response`的通用流程：
    - 直接获取Node侧返回的`ResponseDelegate`，保存起来。
    - 设计stream state机制来重新构建stream：每当Node侧发token时，Browser侧会因为RPC调用的原因，触发stream state唤醒状态。于是回到token stream建设流程中，不断yield token，直到token 为undefined。当无法看到有新的token时，则进入睡眠状态。
  - Browser侧会让Chat Agent的StreamingChatAgent消费Browser侧重建的AsyncIterator流。拿到每一个token后将原始流式 token 转成聊天系统理解的内容模型（ChatResponseContent），提供给UI层直接使用。
  - Browser侧Agent继承`StreamingChatAgent`开发具体的Agent功能：
    - `orchestrator-chat-agent.ts`
    - `universal-chat-agent.ts`
    - `architect-agent.ts`
    - `coder-agent.ts`
    - `app-tester-chat-agent.ts`
    - `chat-session-summary-agent.ts`
    - `custom-chat-agent.ts`

  ## QA🙋

- 视图层的@chat-view-widget.tsx 总控如何跟AI Chat的AbstractStreamParsingChatAgent关联？

  `ChatViewWidget` 自己并不直接知道 `AbstractStreamParsingChatAgent`，它通过 `ChatService` 和 `ChatModel` 这条“模型通道”间接连上所有 Agent：

  1. **发起请求**：用户在输入框提交后，`ChatViewWidget.onQuery` 调 `chatService.sendRequest(sessionId, chatRequest)`。这时已经把 UI 的需求交给了 `ChatService`。

  2. **`ChatService` 选 Agent**：`ChatService` 根据当前会话的 pinned agent / 默认 agent，找到具体的 `ChatAgent` 实例（例如 `AppTesterChatAgent`）。这些 Agent 都继承自 `AbstractStreamParsingChatAgent`。

  3. **Agent 处理流并写入模型**：`AbstractStreamParsingChatAgent` 在内部拿到 `ChatRequestModel`，调用语言模型，流式消费 token，然后把解析后的 `ChatResponseContent` 写到 `ChatRequestModel.response.response.content`，也就是同一个 `ChatModel`。

  4. **UI 订阅 `ChatModel`**：`ChatViewWidget` 和 `ChatViewTreeWidget` 都持有当前会话的 `ChatModel`；`trackChatModel` 之后，Tree Widget 监听 `ChatModel.onDidChange`。只要 Agent 更新了响应内容，模型变化会驱动 UI 重渲染。

  所以桥梁是 “`ChatViewWidget` → `ChatService` → `AbstractStreamParsingChatAgent`（写 `ChatModel`）→ `ChatViewTreeWidget` 订阅 `ChatModel`”。视图层通过 `ChatService` 触发 Agent，通过共享的 `ChatModel` 接收 Agent 的流式输出，两者保持解耦但数据同步。
