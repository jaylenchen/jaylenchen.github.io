/**
 * Deferred 模式：创建一个可以在外部 resolve/reject 的 Promise
 * 兼容性：所有现代浏览器都支持
 */
export interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
}

/**
 * 创建 Deferred 实例
 */
export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: any) => void
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  
  return { promise, resolve, reject }
}

/**
 * 协程等待器：用于实现等待-唤醒机制
 * 类似协程的 yield/resume 机制，可以暂停和恢复异步执行
 */
export class CoroutineWaiter {
  private waiters: Map<string, Deferred<void>> = new Map()
  
  /**
   * 等待一个信号被唤醒
   * @param signal 信号名称
   * @returns Promise，当信号被唤醒时 resolve
   */
  wait(signal: string): Promise<void> {
    if (!this.waiters.has(signal)) {
      this.waiters.set(signal, createDeferred<void>())
    }
    return this.waiters.get(signal)!.promise
  }
  
  /**
   * 唤醒等待指定信号的所有协程
   * @param signal 信号名称
   */
  wake(signal: string): void {
    const waiter = this.waiters.get(signal)
    if (waiter) {
      waiter.resolve()
      this.waiters.delete(signal)
    }
  }
}

/**
 * 延迟执行函数，使用 Promise 和 requestAnimationFrame 替代 setTimeout
 * @param ms 延迟时间（毫秒）
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    // 使用 requestAnimationFrame 和递归实现更精确的延迟
    // 如果浏览器不支持 requestAnimationFrame，回退到 setTimeout
    if (typeof requestAnimationFrame !== 'undefined') {
      let start = Date.now()
      const frame = () => {
        if (Date.now() - start >= ms) {
          resolve()
        } else {
          requestAnimationFrame(frame)
        }
      }
      requestAnimationFrame(frame)
    } else {
      // 兼容性回退
      setTimeout(() => resolve(), ms)
    }
  })
}

/**
 * 等待条件满足（轮询检查）
 * @param condition 条件检查函数
 * @param interval 检查间隔（毫秒）
 * @param timeout 超时时间（毫秒），0 表示不超时
 * @returns Promise，当条件满足时 resolve，超时时 reject
 */
export async function waitForCondition(
  condition: () => boolean,
  interval: number = 50,
  timeout: number = 0
): Promise<void> {
  const startTime = Date.now()
  
  return new Promise((resolve, reject) => {
    const check = async () => {
      if (condition()) {
        resolve()
        return
      }
      
      // 检查超时
      if (timeout > 0 && Date.now() - startTime >= timeout) {
        reject(new Error('Wait condition timeout'))
        return
      }
      
      // 等待一段时间后再次检查
      await delay(interval)
      check()
    }
    
    check()
  })
}

