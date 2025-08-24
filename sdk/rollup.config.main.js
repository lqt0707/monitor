import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';

const isProduction = process.env.NODE_ENV === 'production';

const basePlugins = [
    replace({
        preventAssignment: true,
        values: {
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
            '__VERSION__': JSON.stringify(process.env.npm_package_version || '1.0.0'),
        },
    }),
    json(),
    resolve({
        browser: true,
        preferBuiltins: false,
    }),
    commonjs(),
];

// 主入口配置
const mainConfig = defineConfig([
    // ES Module 构建
    {
        input: 'index.js',
        output: {
            file: 'dist/index.esm.js',
            format: 'es',
            sourcemap: true,
        },
        plugins: [
            ...basePlugins,
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
        input: 'index.js',
        output: {
            file: 'dist/index.js',
            format: 'cjs',
            sourcemap: true,
            exports: 'named',
        },
        plugins: [
            ...basePlugins,
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
]);

export default mainConfig;