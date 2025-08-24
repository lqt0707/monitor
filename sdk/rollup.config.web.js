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
            '__PLATFORM__': JSON.stringify('web'),
        },
    }),
    json(),
    resolve({
        browser: true,
        preferBuiltins: false,
    }),
    commonjs(),
];

// Web SDK配置
const webConfig = defineConfig([
    // ES Module 构建
    {
        input: 'web-core/index.ts',
        output: {
            file: 'web-core/dist/index.esm.js',
            format: 'es',
            sourcemap: true,
        },
        plugins: [
            ...basePlugins,
            typescript({
                tsconfig: 'web-core/tsconfig.json',
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
        external: [],
    },

    // CommonJS 构建
    {
        input: 'web-core/index.ts',
        output: {
            file: 'web-core/dist/index.js',
            format: 'cjs',
            sourcemap: true,
            exports: 'named',
        },
        plugins: [
            ...basePlugins,
            typescript({
                tsconfig: 'web-core/tsconfig.json',
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
        external: [],
    },

    // UMD 构建（用于CDN）
    {
        input: 'web-core/index.ts',
        output: {
            file: 'web-core/dist/index.umd.js',
            format: 'umd',
            name: 'MonitorSDK',
            sourcemap: true,
            exports: 'named',
        },
        plugins: [
            ...basePlugins,
            typescript({
                tsconfig: 'web-core/tsconfig.json',
                declaration: false,
                declarationMap: false,
            }),
        ],
        external: [],
    },

    // UMD 压缩版本
    {
        input: 'web-core/index.ts',
        output: {
            file: 'web-core/dist/index.min.js',
            format: 'umd',
            name: 'MonitorSDK',
            sourcemap: true,
            exports: 'named',
        },
        plugins: [
            ...basePlugins,
            typescript({
                tsconfig: 'web-core/tsconfig.json',
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
        external: [],
    },

    // 类型定义构建
    {
        input: 'web-core/index.ts',
        output: {
            file: 'web-core/dist/index.d.ts',
            format: 'es',
        },
        plugins: [
            dts({
                tsconfig: 'web-core/tsconfig.json',
            }),
        ],
        external: [],
    },
]);

export default webConfig;