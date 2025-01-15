// 定义重试选项接口
interface RetryOptions {
  maxAttempts?: number; // 最大重试次数
  initialDelay?: number; // 初始延迟时间(毫秒)
  maxDelay?: number; // 最大延迟时间(毫秒)
  backoff?: number; // 退避系数
}

/**
 * 通用的异步函数重试工具
 * @param fn 需要重试的异步函数
 * @param options 重试选项
 * @returns Promise<T> 函数执行结果
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // 设置默认选项
  const {
    maxAttempts = 3, // 默认最多重试3次
    initialDelay = 1000, // 默认初始延迟1秒
    maxDelay = 10000, // 默认最大延迟10秒
    backoff = 2, // 默认退避系数为2
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  // 尝试执行指定次数
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // 如果是最后一次尝试，则抛出错误
      if (attempt === maxAttempts) {
        throw new Error(`重试${maxAttempts}次后失败: ${lastError.message}`);
      }

      // 计算下一次延迟时间（指数退避）
      delay = Math.min(delay * backoff, maxDelay);

      // 等待延迟时间后继续重试
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // 这行代码理论上永远不会执行，但TypeScript需要它
  throw lastError;
}
