/**
 * 依赖管理工具
 * 用于解决模块间的循环依赖问题
 */

import { forwardRef } from '@nestjs/common';

/**
 * 创建前向引用包装器
 * 用于解决循环依赖问题
 */
export class ForwardRefWrapper<T> {
  private readonly forwardRef: () => T;
  
  constructor(provider: () => T) {
    this.forwardRef = provider;
  }
  
  /**
   * 获取实际的依赖实例
   */
  get(): T {
    return this.forwardRef();
  }
  
  /**
   * 创建前向引用
   */
  static create<T>(provider: () => T): ForwardRefWrapper<T> {
    return new ForwardRefWrapper(provider);
  }
}

/**
 * 延迟加载工具
 * 用于按需加载依赖
 */
export class LazyLoader<T> {
  private instance: T | null = null;
  private readonly loader: () => T;
  
  constructor(loader: () => T) {
    this.loader = loader;
  }
  
  /**
   * 获取实例（按需加载）
   */
  get(): T {
    if (!this.instance) {
      this.instance = this.loader();
    }
    return this.instance;
  }
  
  /**
   * 重置实例
   */
  reset(): void {
    this.instance = null;
  }
}

/**
 * 依赖注入辅助工具
 */
export class DependencyUtils {
  /**
   * 创建循环依赖解决方案
   * @param providers 相互依赖的提供者数组
   */
  static createCircularDependencySolution<T extends any[]>(...providers: {
    [K in keyof T]: () => T[K]
  }): T {
    const instances: any[] = [];
    
    for (let i = 0; i < providers.length; i++) {
      instances.push(new ForwardRefWrapper(providers[i]));
    }
    
    return instances as T;
  }
  
  /**
   * 检查是否存在循环依赖
   * @param dependencies 依赖图
   * @returns 是否存在循环依赖
   */
  static hasCircularDependency(dependencies: Record<string, string[]>): boolean {
    const visited: Set<string> = new Set();
    const recursionStack: Set<string> = new Set();
    
    const check = (module: string): boolean => {
      if (!visited.has(module)) {
        visited.add(module);
        recursionStack.add(module);
        
        const deps = dependencies[module] || [];
        for (const dep of deps) {
          if (!visited.has(dep) && check(dep)) {
            return true;
          } else if (recursionStack.has(dep)) {
            return true;
          }
        }
      }
      recursionStack.delete(module);
      return false;
    };
    
    for (const module of Object.keys(dependencies)) {
      if (check(module)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 获取模块依赖图
   * @param modules 模块列表
   * @returns 依赖图
   */
  static getDependencyGraph(modules: any[]): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    
    for (const module of modules) {
      const moduleName = module.constructor?.name || 'Unknown';
      graph[moduleName] = [];
      
      // 这里可以扩展为实际分析模块的依赖
      // 目前返回空数组，需要根据实际项目结构实现
    }
    
    return graph;
  }
}

/**
 * 提供者工厂
 * 用于创建延迟加载的提供者
 */
export function createLazyProvider<T>(factory: () => T) {
  return {
    provide: Symbol('LAZY_PROVIDER'),
    useFactory: () => new LazyLoader(factory),
  };
}

/**
 * 前向引用提供者工厂
 */
export function createForwardRefProvider<T>(provider: any) {
  return {
    provide: Symbol('FORWARD_REF_PROVIDER'),
    useFactory: () => forwardRef(() => provider),
  };
}