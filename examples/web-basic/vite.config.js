/**
 * Vite 配置文件
 * 用于配置开发服务器和构建选项
 */
import { defineConfig } from 'vite';

export default defineConfig({
  // 开发服务器配置
  server: {
    port: 8080,
    host: true,
    open: true
  },

  // 构建配置
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },

  // 基础路径
  base: './',

  // 定义全局常量
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  }
});