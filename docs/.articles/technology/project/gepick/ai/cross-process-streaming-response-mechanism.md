# 一种跨进程异步流推送与消费的实现方案

<details>
  <summary>前置知识</summary>

- RPC机制
</details>

## 背景

在一个AI Chat系统的开发当中，流式响应的实现是一个无法逃避的问题，它能让用户实时看到AI的回答，而不是等AI回答完之后再一次性展示给用户。这一回，我们来探讨一种跨进程（Browser-Node）异步流推送与消费的实现方式。

## 架构

设想下我们从头设计一个`AI System`，它要适配多种不同的语言模型供应商，管理多种语言模型。为了安全性，功能实现上真正的`LanguageModel`的管理只能够放在`Node`侧，而`Browser`侧只需要管理这些`LanguageModel`的代理。那么就产生了这样的交互线：

- `Browser`侧通过选择指定的`LanguageModel`代理发起请求，经过`RPC`将请求发送到`Node`侧获取真正的`LanguageModel`进行`LLM`请求处理。
- 在`Node`侧通过`RPC`将响应发送到`Browser`侧并消费该响应。

基本示意图如下：

```mermaid
graph TB
    subgraph Agents[Agents]
      subgraph Agent1[ChatAgent]
        invoke1[[invoke</br></br><i>（collect all tools and messages to send llm-request, then get llm-response.）</i>]]
      end
    
      subgraph Agent2[TestAgent]
        invoke2[[invoke</br></br><i>（collect all tools and messages to send llm-request, then get llm-response.）</i>]]
      end
    end
    
    subgraph LLMRegistryFrontend[<i>Browser-Impl</i>]
      subgraph LLMProxy1[LLM-Proxy]
        preq1[[request]]
        send1[[send]]
      end
    
      subgraph LLMProxy2[LLM-Proxy]
        preq2[[request]]
        send2[[send]]
      end
    end
    
    subgraph LLMRegistryNode[<i>Node-Impl</i>]
       subgraph LLMAdaptor1[LLM-Adaptor]
         req1[[request]]
         psend1[[send]]
       end
    
    	 subgraph LLMAdaptor2[LLM-Adaptor]
         req2[[request]]
         psend2[[send]]
       end
    end
    
    subgraph LLMRegistry
      LLMRegistryFrontend
      LLMRegistryNode
      
      Rpc1{{Rpc}}
      Rpc2{{Rpc}}
      Rpc3{{Rpc}}
      Rpc4{{Rpc}}
    end
  
    
  
    subgraph LLM-Providers[LLM-Providers]
      subgraph Google[Google]
        GLLM1(Gemini2.0)
        GLLM2(Gemini1.0)
      end
      subgraph OpenAI[OpenAI]
        OLLM1(GPT4.5)
        OLLM2(GPT5.0)
      end
    end
  
  Agent1 -.- |⬇︎|preq1
  Agent1 -.- |⬆︎|send1
  
  Agent2 -.- |⬇︎|preq2
  Agent2 -.- |⬆︎|send2
  
  preq1 -.-|<b>⬇︎</b>| Rpc1 -.-|⬇︎| req1
  send1 -.- |⬆︎|Rpc2 -.-|<b>⬆︎</b>| psend1
  req1 -.- |<b>⬇︎</b>| GLLM1
  psend1 -.- |<b>⬆︎</b>| GLLM1
  
  preq2 -.-|<b>⬇︎</b>| Rpc3 -.-|⬇︎| req2
  send2 -.- |⬆︎|Rpc4 -.-|<b>⬆︎</b>| psend2
  req2 -.- |<b>⬇︎</b>| OLLM2
  psend2 -.- |<b>⬆︎</b>| OLLM2
  
  style Agents fill:#a8c1c8,stroke-dasharray: 6, 6,stroke-width:2px;
  style Agent1 fill:#b8d1d8,rx:10px,ry:10px;
  style Agent2 fill:#b8d1d8,rx:10px,ry:10px;
  style Rpc1 fill:#c8d0d8;
  style Rpc2 fill:#c8d0d8;
  style Rpc3 fill:#c8d0d8;
  style Rpc4 fill:#c8d0d8;
  style LLMProxy1 fill:#ecb950,rx:10px,ry:10px;
  style LLMProxy2 fill:#ecb950,rx:10px,ry:10px;
  style LLMAdaptor1 fill:#bcf6d3,rx:10px,ry:10px;
  style LLMAdaptor2 fill:#bcf6d3,rx:10px,ry:10px;
  style LLMRegistry fill:#c8c1d8,stroke-dasharray: 6, 6,stroke-width:2px;
  style LLMRegistryFrontend fill:#c8d0d8;
  style LLMRegistryNode fill:#c8d0d8;
  style LLM-Providers fill:#c8c1d8,stroke-dasharray: 6, 6,stroke-width:2px;
```



```mermaid
graph LR
```

