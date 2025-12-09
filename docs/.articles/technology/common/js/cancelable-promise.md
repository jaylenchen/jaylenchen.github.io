# 一种可取消的Promise：CancelablePromise

<details>
  <summary>前置知识</summary>

- [Cancellation机制](/technology/common/js/cancellation-token-source)
</details>

## 背景

传统的`Promise`是没有中断机制的，一旦执行无论如何都会执行到底。但是实际的应用场景当中，有可能希望创建一个可中断的`Promise`，尽早中断相关的异步操作，避免继续浪费资源和时间。

## 实现

```ts
function createCancelablePromise<T>(callback: (token: CancellationToken) => Promise<T>): CancelablePromise<T> {
	const source = new CancellationTokenSource();

	const thenable = callback(source.token);

	let isCancelled = false;

	const promise = new Promise<T>((resolve, reject) => {
    // 如果这个新创建的promise被取消了，那么该promise的处理结果会被丢弃，不会返回任何结果，而是得到一个`CancellationError`
		const subscription = source.token.onCancellationRequested(() => {
			isCancelled = true;
			subscription.dispose();
			reject(new CancellationError());
		});
    // 否则将根据task的执行情况执行promise的`then`或者`catch`。
    // 使用Promise.resolve确保thenable的转换状态过渡，它有可能是resolved也可能是rejected状态。
		Promise.resolve(thenable).then(value => {
			subscription.dispose();
			source.dispose();

			if (!isCancelled) {
				resolve(value);

			} else if (isDisposable(value)) {
				value.dispose();
			}
		}, err => {
			subscription.dispose();
			source.dispose();
			reject(err);
		});
	});

	return <CancelablePromise<T>>new class {
		cancel() {
			source.cancel();
			source.dispose();
		}
		then<TResult1 = T, TResult2 = never>(resolve?: ((value: T) => TResult1 | Promise<TResult1>) | undefined | null, reject?: ((reason: unknown) => TResult2 | Promise<TResult2>) | undefined | null): Promise<TResult1 | TResult2> {
			return promise.then(resolve, reject);
		}
		catch<TResult = never>(reject?: ((reason: unknown) => TResult | Promise<TResult>) | undefined | null): Promise<T | TResult> {
			return this.then(undefined, reject);
		}
		finally(onfinally?: (() => void) | undefined | null): Promise<T> {
			return promise.finally(onfinally);
		}
	};
}
```

可取消`Promise`是基于[Cancellation机制](/technology/common/js/cancellation-token-source)配合原生`Promise`进行实现的，它其实是[Cancellation机制](/technology/common/js/cancellation-token-source)的一个实际应用封装。实际上通过`createCancelablePromise()`调用后获取到的`CancelablePromise`拥有原生`Promise`常用的`then`、`catch`、`finally`三个方法，而内部的实现无非就是这三个方法原路转发给原生`Promise`而已。而多出来的`cancel`方法就是新增的取消操作，核心逻辑还是[Cancellation机制](/technology/common/js/cancellation-token-source)的取消操作，即使用`cancellationTokenSource.cancel`方法发起取消请求。

而调用方拿到的`CancelablePromise`实际上是通过`createCancelablePromise`工厂内部创建的`promise`的一个代理包装而已，`CancelablePromise`的状态由内部这个`promise`的状态来决定。内部创建出来的`promise`通过两个行为途径来决定自身的状态改变：

- `token.onCancellationRequested`：它在取消请求到来时最终将该`promise`转换到`rejected`状态。
- `const thenable = callback(source.token)`：它自身状态确立后进一步决定将该`promise`转换到`resolved`状态或者是`rejected`状态，具体的状态确立由它自身这个`task`的行为执行的结果来决定。

调用方可以使用`cancelablePromise.cancel`发起取消请求到内部创建的`promise`，内部`promise`在创建之初就通过构造函数接收的`executor`里头通过`token.onCancellationRequested`监听外部调用方发来的取消请求，从而进一步将内部的`promise`状态转为`rejected`，从而将外部使用的这个`cancelablePromise`转为`rejected`状态。
