const typescript = require('@rollup/plugin-typescript');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const replace = require('@rollup/plugin-replace');
const terser = require('@rollup/plugin-terser');
const { dts } = require('rollup-plugin-dts');
const { visualizer } = require('rollup-plugin-visualizer');
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const isDev = process.env.NODE_ENV === 'development';
const isAnalyze = process.env.ANALYZE === 'true';
const target = process.env.TARGET;

// 通用插件配置
const createPlugins = (tsconfig, minify = true) => [
    replace({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        '__VERSION__': JSON.stringify(pkg.version),
        preventAssignment: true
    }),
    nodeResolve({
        browser: true,
        preferBuiltins: false
    }),
    commonjs(),
    json(),
    typescript({
        tsconfig,
        declaration: false,
        declarationMap: false
    }),
    !isDev && minify && terser({
        compress: {
            drop_console: true,
            drop_debugger: true
        }
    }),
    isAnalyze && visualizer({
        filename: `${tsconfig.replace('tsconfig.json', 'stats.html')}`,
        open: true
    })
].filter(Boolean);

// 类型定义插件
const createDtsPlugins = (tsconfig) => [
    dts({
        tsconfig,
        respectExternal: true
    })
];

// 构建配置
const configs = [];

// 检查入口文件是否存在
function checkInputFile(input) {
    if (!existsSync(input)) {
        console.warn(`⚠️  入口文件不存在: ${input}`);
        return false;
    }
    return true;
}

// Core 模块
if (!target || target === 'core') {
    if (checkInputFile('core/index.ts')) {
        const coreBase = {
            input: 'core/index.ts',
            external: [],
            plugins: createPlugins('core/tsconfig.json')
        };

        configs.push(
            // ESM
            {
                ...coreBase,
                output: {
                    file: 'core/dist/index.esm.js',
                    format: 'es',
                    sourcemap: !isDev
                }
            },
            // CJS
            {
                ...coreBase,
                output: {
                    file: 'core/dist/index.js',
                    format: 'cjs',
                    exports: 'named',
                    sourcemap: !isDev
                }
            },
            // 类型定义
            {
                input: 'core/index.ts',
                output: {
                    file: 'core/dist/index.d.ts',
                    format: 'es'
                },
                plugins: createDtsPlugins('core/tsconfig.json')
            }
        );
    }
}

// Web Core 模块
if (!target || target === 'web') {
    if (checkInputFile('web-core/index.ts')) {
        const webBase = {
            input: 'web-core/index.ts',
            external: [],
            plugins: createPlugins('web-core/tsconfig.json')
        };

        configs.push(
            // ESM
            {
                ...webBase,
                output: {
                    file: 'web-core/dist/index.esm.js',
                    format: 'es',
                    sourcemap: !isDev
                }
            },
            // CJS
            {
                ...webBase,
                output: {
                    file: 'web-core/dist/index.js',
                    format: 'cjs',
                    exports: 'named',
                    sourcemap: !isDev
                }
            },
            // UMD (用于CDN)
            {
                ...webBase,
                output: {
                    file: 'web-core/dist/index.umd.js',
                    format: 'umd',
                    name: 'MonitorWebSDK',
                    exports: 'named',
                    sourcemap: !isDev
                }
            },
            // 压缩版本
            {
                ...webBase,
                plugins: [...createPlugins('web-core/tsconfig.json', true)],
                output: {
                    file: 'web-core/dist/index.min.js',
                    format: 'umd',
                    name: 'MonitorWebSDK',
                    exports: 'named',
                    sourcemap: !isDev
                }
            },
            // 类型定义
            {
                input: 'web-core/index.ts',
                output: {
                    file: 'web-core/dist/index.d.ts',
                    format: 'es'
                },
                plugins: createDtsPlugins('web-core/tsconfig.json')
            }
        );
    }
}

// Taro Core 模块
if (!target || target === 'taro') {
    if (checkInputFile('taro-core/index.ts')) {
        const taroBase = {
            input: 'taro-core/index.ts',
            external: ['@tarojs/taro'],
            plugins: createPlugins('taro-core/tsconfig.json')
        };

        configs.push(
            // ESM
            {
                ...taroBase,
                output: {
                    file: 'taro-core/dist/index.esm.js',
                    format: 'es',
                    sourcemap: !isDev
                }
            },
            // CJS
            {
                ...taroBase,
                output: {
                    file: 'taro-core/dist/index.js',
                    format: 'cjs',
                    exports: 'named',
                    sourcemap: !isDev
                }
            },
            // 压缩版本
            {
                ...taroBase,
                plugins: [...createPlugins('taro-core/tsconfig.json', true)],
                output: {
                    file: 'taro-core/dist/index.min.js',
                    format: 'es',
                    sourcemap: !isDev
                }
            },
            // 类型定义
            {
                input: 'taro-core/index.ts',
                output: {
                    file: 'taro-core/dist/index.d.ts',
                    format: 'es'
                },
                plugins: createDtsPlugins('taro-core/tsconfig.json')
            }
        );
    }
}

// 主入口模块
if (!target || target === 'main') {
    if (checkInputFile('index.ts')) {
        const mainBase = {
            input: 'index.ts',
            external: [],
            plugins: createPlugins('./tsconfig.json')
        };

        configs.push(
            // ESM
            {
                ...mainBase,
                output: {
                    file: 'dist/index.esm.js',
                    format: 'es',
                    sourcemap: !isDev
                }
            },
            // CJS
            {
                ...mainBase,
                output: {
                    file: 'dist/index.js',
                    format: 'cjs',
                    exports: 'named',
                    sourcemap: !isDev
                }
            },
            // 类型定义
            {
                input: 'index.ts',
                output: {
                    file: 'dist/index.d.ts',
                    format: 'es'
                },
                plugins: createDtsPlugins('./tsconfig.json')
            }
        );
    }
}

module.exports = configs;