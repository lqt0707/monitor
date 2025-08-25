import { useEffect, useRef } from 'react';

/**
 * 组件初始加载hook
 * 用于处理组件挂载时的初始操作，避免StrictMode下的重复执行
 * @param callback 初始加载时需要执行的回调函数
 * @param dependencies 依赖项数组，默认为空数组
 */
export const useInitialLoad = (
  callback: () => void,
  dependencies: any[] = []
) => {
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      callback();
    }
  }, dependencies);

  return {
    /** 是否为初始加载状态 */
    isInitialLoad: isInitialLoad.current,
  };
};