import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import { readFileSync } from 'fs';
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Rollup构建配置
 * 支持多种输出格式：UMD、ESM、CommonJS
 */
export default [
  // UMD构建 - 用于浏览器直接引入
  {
    input: 'src/index.ts',
    output: {
      name: 'MonitorSDK',
      file: 'dist/index.umd.js',
      format: 'umd',
      sourcemap: true,
      globals: {
        // 如果有外部依赖，在这里定义全局变量名
      }
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false, // UMD版本不需要类型声明
        declarationMap: false
      }),
      isProduction && terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        },
        mangle: {
          reserved: ['MonitorSDK']
        }
      })
    ].filter(Boolean),
    external: []
  },
  // ESM构建 - 用于现代模块系统
  {
    input: 'src/index.ts',
    output: {
      file: pkg.module,
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
        declarationMap: true
      })
    ],
    external: []
  },
  // CommonJS构建 - 用于Node.js环境
  {
    input: 'src/index.ts',
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
      exports: 'auto'
    },
    plugins: [
      resolve({
        preferBuiltins: true
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false
      })
    ],
    external: []
  }
];