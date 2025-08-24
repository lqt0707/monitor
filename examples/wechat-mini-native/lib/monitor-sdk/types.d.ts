/**
 * 微信小程序全局对象类型声明
 */
declare const wx: {
  request: (options: {
    url: string;
    method?: string;
    data?: any;
    header?: Record<string, string>;
    success?: (res: any) => void;
    fail?: (err: any) => void;
    complete?: () => void;
  }) => void;
};

declare const global: {
  wx?: typeof wx;
};