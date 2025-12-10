# Promise的认知细节

## executor函数

- `Promise`新建后executor函数就会立即执行： `new Promise( (c, e) => { 立即执行})`

## 正常处理

- `resolve`函数用于将`Promise`状态从`pending`转变为`fulfilled`，并将结果值传递给`then`回调函数。
  ```ts
  const promise = new Promise((resolve, reject) => {
    resolve(result);
  });

  promise.then(result => {
    console.log(result);
  });
  ```
- `resolve(promise)`：`resolve(v)`中的`v`可以是`Promise`实例。
  ```ts
    const thenable = new Promise((resolve, reject) => {
        resolve(result);
        // or
        reject(new Error('error'));
    });
    const promise = new Promise((resolve) => {
       resolve(thenable);
    });
    promise.then(result => {
      console.log(result);
    });
    promise.catch(error => {
      console.log(error);
    });
  ```
  此时`promise`的状态由`thenable`决定，`promise`自身怎么用`resolve`，`reject`都无效了，相当于`thenable`控制`promise`的状态:
  - 当`thenable`状态从`pending`转`resolved`，那么执行`promise.then`；
  - 当`thenable`状态从`pending`转`rejected`，那么执行`promise.catch`

- `Promise.resolve(promise)`：由于`Promise.resolve(v)`等价于`new Promise(resolve => resolve(v))`，所以`Promise.resolve(promise)`等价于`new Promise(resolve => resolve(promise))`。又因为当`resolve(v)`中的`v`是`Promise`实例时，则当前`resolve`所在的`Promise`实例的具体状态就由`v`决定。因此`Promise.resolve(promise)`的最终状态就由`promise`决定，`Promise.resolve`本身在这里只是起到了包装一个参数为`Promise`实例的作用，并不会影响`promise`的状态，别被它的名字中带`resolve`误导了，它不是将当前`promise`的状态转为`resolved`。简而言之，`resolve(promise)`拿到的是`promise`本身，接下来的行为都由它的状态来决定。
  
  实际工程上通常喜欢使用`Promise.resolve(thenable)`来包装一个`thenable`对象，从而确保`thenable`的`then`回调送入到微任务队列中执行，而不是立即同步执行。因为一个`thenable`对象的`then`方法可能是一个异步操作，也可能是一个同步操作，如果是一个同步操作，那么`thenable`的`then`回调会立即执行，此时我们为了统一行为，避免潜在的同步执行导致的问题，通常使用`Promise.resolve(thenable)`来统一将`then`回调送入微任务队列等到事件循环的末尾再执行。

## 异常处理

- `reject`函数用于将`Promise`状态从`pending`转变为`rejected`，并将错误信息传递给`catch`回调函数。
  ```ts
  const promise = new Promise((resolve, reject) => {
    reject(new Error('error'));
  });

  promise.catch(error => {
    console.log(error);
  });
  ```
  其中`reject(e)`中的`e`是`Error`实例，会被`catch`回调函数接收。

- 在`new Promise((c,e) => {…})`当中执行抛出错误会令`promise`状态从`pending`转`rejected`，导致走`catch`回调。常见的抛出错误的方式如下：
  ```ts
  let promise: Promise<void>;

  // 方式一：直接抛出错误
  promise = new Promise(() => {
    throw new Error('error');
  });

  // 方式二：使用try...catch捕获错误
  promise = new Promise((_, reject) => {
    try{ 
        throw new Error('error'); 
    } catch(e) { 
        reject(e); 
    }
  });
  
  // 方式三：使用reject函数
  promise = new Promise((_, reject) => {
    reject(new Error('error'));
  });

  promise.catch(error => {
    console.log(error);
  });
  ```
  以上三种方式都会导致`promise`状态从`pending`转`rejected`，从而走`catch`回调。