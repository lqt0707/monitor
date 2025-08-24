import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import dts from 'rollup-plugin-dts';

const isProduction = process.env.NODE_ENV === 'production';

const basePlugins = [
    replace({
        preventAssignment: true,
        values: {
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
            '__VERSION__': JSON.stringify(process.env.npm_package_version || '1.0.0'),
            '__PLATFORM__': JSON.stringify('taro'),
        },
    }),
    json(),
    resolve({
        browser: false,
        preferBuiltins: false,
    }),
    commonjs(),
];

// Taro SDK配置
const taroConfig = defineConfig([
    // ES Module 构建
    {
        input: 'taro-core/index.ts',
        output: {
            file: 'taro-core/dist/index.esm.js',
            format: 'es',
            sourcemap: true,
        },
        plugins: [
            ...basePlugins,
            typescript({
                tsconfig: 'taro-core/tsconfig.json',
                declaration: false,
                declarationMap: false,
            }),
            isProduction && terser({
                compress: {
                    drop_console: false,
                    drop_debugger: true,
                },
                mangle: {
                    keep_fnames: true,
                },
            }),
        ].filter(Boolean),
        external: ['@tarojs/taro'],
    },

    // CommonJS 构建
    {
        input: 'taro-core/index.ts',
        output: {
            file: 'taro-core/dist/index.js',
            format: 'cjs',
            sourcemap: true,
            exports: 'named',
        },
        plugins: [
            ...basePlugins,
            typescript({
                tsconfig: 'taro-core/tsconfig.json',
                declaration: false,
                declarationMap: false,
            }),
            isProduction && terser({
                compress: {
                    drop_console: false,
                    drop_debugger: true,
                },
                mangle: {
                    keep_fnames: true,
                },
            }),
        ].filter(Boolean),
        external: ['@tarojs/taro'],
    },

    // 压缩版本
    {
        input: 'taro-core/index.ts',
        output: {
            file: 'taro-core/dist/index.min.js',
            format: 'cjs',
            sourcemap: true,
            exports: 'named',
        },
        plugins: [
            ...basePlugins,
            typescript({
                tsconfig: 'taro-core/tsconfig.json',
                declaration: false,
                declarationMap: false,
            }),
            terser({
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                },
                mangle: true,
            }),
        ],
        external: ['@tarojs/taro'],
    },

    // 类型定义构建
    {
        input: 'taro-core/index.ts',
        output: {
            file: 'taro-core/dist/index.d.ts',
            format: 'es',
        },
        plugins: [
            dts({
                tsconfig: 'taro-core/tsconfig.json',
            }),
        ],
        external: ['@tarojs/taro'],
    },
]);

export default taroConfig;