import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import dts from 'rollup-plugin-dts';
import { readFileSync } from 'fs';
import { join } from 'path';

// 读取package.json获取版本信息
const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));

/**
 * 通用插件配置
 */
const commonPlugins = [
  resolve({
    browser: false,
    preferBuiltins: true
  }),
  commonjs(),
  json()
];

/**
 * TypeScript插件配置
 */
const typescriptPlugin = typescript({
  tsconfig: './tsconfig.json',
  declaration: false,
  declarationMap: false,
  sourceMap: true
});

/**
 * 外部依赖配置
 * 这些依赖不会被打包进最终产物
 */
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  'events',
  'deepmerge'
];

/**
 * Rollup配置
 */
export default [
  // CommonJS 构建
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    external,
    plugins: [
      ...commonPlugins,
      typescriptPlugin
    ]
  },
  
  // ES Module 构建
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true
    },
    external,
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        sourceMap: true
      })
    ]
  },
  
  // TypeScript 声明文件构建
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es'
    },
    external,
    plugins: [
      dts({
        tsconfig: './tsconfig.json'
      })
    ]
  }
];