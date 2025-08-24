/**
 * Taro小程序环境全局类型声明
 */

declare global {
  const console: {
    log: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    info: (...args: any[]) => void;
    debug: (...args: any[]) => void;
  };

  const setTimeout: (callback: () => void, delay: number) => number;
  const clearTimeout: (id: number) => void;
  const setInterval: (callback: () => void, delay: number) => number;
  const clearInterval: (id: number) => void;

  const btoa: (data: string) => string;
  const atob: (data: string) => string;

  const process: {
    env: {
      NODE_ENV?: string;
      [key: string]: string | undefined;
    };
  };

  namespace globalThis {
    var location:
      | {
          href: string;
          hostname: string;
        }
      | undefined;

    var document:
      | {
          title: string;
          referrer: string;
        }
      | undefined;

    var navigator:
      | {
          userAgent: string;
          connection?: any;
        }
      | undefined;
  }
}

export {};
