import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
import globby from "globby";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// 可识别为文本的后缀
const TXT_EXT = [
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".vue",
    ".css",
    ".scss",
    ".less",
    ".html",
    ".json",
    ".xml",
    ".yaml",
    ".yml",
    ".md",
    ".txt",
    ".csv",
    ".map",
];

// 默认排除（可按需扩展）
const EXCLUDES = [
    "**/node_modules/**",
    "**/.git/**",
    "**/build/**",
    "**/coverage/**",
    "**/*.log",
    "**/.DS_Store",
    "**/.env",
    "**/.env.*",
    "**/package-lock.json",
    "**/yarn.lock",
];

/**
 * 计算文件的MD5哈希值
 * @param {Buffer} buf 文件内容缓冲区
 * @returns {string} MD5哈希字符串
 */
function md5(buf) {
    return crypto.createHash("md5").update(buf).digest("hex");
}

/**
 * 根据文件扩展名识别文件类型
 * @param {string} file 文件名
 * @returns {string} 文件类型标识
 */
function fileType(file) {
    const ext = path.extname(file).toLowerCase();
    const map = {
        ".js": "javascript",
        ".ts": "typescript",
        ".jsx": "javascript",
        ".tsx": "typescript",
        ".vue": "vue",
        ".css": "css",
        ".scss": "scss",
        ".less": "less",
        ".html": "html",
        ".json": "json",
        ".xml": "xml",
        ".yaml": "yaml",
        ".yml": "yaml",
        ".md": "markdown",
        ".txt": "text",
        ".csv": "text",
        ".map": "sourcemap",
    };
    return map[ext] || (TXT_EXT.includes(ext) ? "text" : "binary");
}

/**
 * 源代码打包主函数
 * 支持命令行参数和配置文件两种方式
 */
async function main() {
    // 参数解析：支持命令行参数和配置文件
    const args = Object.fromEntries(
        process.argv
            .slice(2)
            .map((s) => s.split("="))
            .map(([k, v]) => [k.replace(/^--/, ""), v ?? true])
    );

    let config = {};
    
    // 读取配置文件
    if (args.config) {
        try {
            const configContent = fs.readFileSync(args.config, 'utf8');
            config = JSON.parse(configContent);
        } catch (error) {
            console.error("配置文件读取失败:", error.message);
            process.exit(1);
        }
    }

    // 优先使用命令行参数，其次使用配置文件参数
    const projectId = args.projectId || args.p || config.projectId;
    const version = args.version || args.v || config.version;
    const workdir = args.cwd ? path.resolve(args.cwd) : root;

    if (!projectId || !version) {
        console.error("缺少参数：--projectId 与 --version");
        process.exit(1);
    }

    const out =
        args.out ||
        path.join(workdir, "dist", `${projectId}-${version}.zip`);

    fs.mkdirSync(path.dirname(out), { recursive: true });

    const zip = new AdmZip();
    const rootInZip = `${projectId}-${version}/`;

    // 使用配置文件中的包含/排除模式，或默认值
    const includes = config.includePatterns || ["**/*", "**/*.map"];
    const excludes = config.excludePatterns || EXCLUDES;
    
    // 获取源代码包含模式（用于分离打包）
    const sourceIncludePatterns = config.sourceIncludePatterns || includes;
    
    // 获取Sourcemap包含模式（用于分离打包）
    const sourcemapIncludePatterns = config.sourcemapIncludePatterns || ["**/*.map"];
    
    // 获取源代码排除模式（用于分离打包）
    const sourceExcludePatterns = config.sourceExcludePatterns || excludes;
    
    // 获取Sourcemap排除模式（用于分离打包）
    const sourcemapExcludePatterns = config.sourcemapExcludePatterns || [
        "dist/**/*.js",
        "dist/**/*.css",
        "dist/**/*.html"
    ];
    
    // 根据打包模式选择文件
    let files = [];
    const packMode = config.mode || "basic";
    
    if (packMode === "source") {
        // 仅打包源代码
        files = await globby(sourceIncludePatterns, {
            cwd: workdir,
            dot: true,
            ignore: sourceExcludePatterns,
            onlyFiles: true,
            followSymbolicLinks: false,
        });
    } else if (packMode === "sourcemap") {
        // 仅打包Sourcemap
        files = await globby(sourcemapIncludePatterns, {
            cwd: workdir,
            dot: true,
            ignore: sourcemapExcludePatterns,
            onlyFiles: true,
            followSymbolicLinks: false,
        });
    } else {
        // 默认模式：打包所有文件
        files = await globby(includes, {
            cwd: workdir,
            dot: true,
            ignore: excludes,
            onlyFiles: true,
            followSymbolicLinks: false,
        });
    }

    // 定义manifest对象类型
    const manifest = {
        projectId,
        version,
        buildId: process.env.BUILD_ID || "",
        branch: process.env.GIT_BRANCH || "",
        commit: process.env.GIT_COMMIT || "",
        generatedAt: new Date().toISOString(),
        files: [],
    };

    for (const rel of files) {
        const abs = path.join(workdir, rel);
        const buf = fs.readFileSync(abs);
        const type = fileType(rel);
        const isText = type !== "binary";
        // 添加文件信息到manifest
        const fileInfo = {
            path: rel.replaceAll("\\", "/"),
            size: buf.length,
            md5: md5(buf),
            type,
            text: isText,
        };
        manifest.files.push(fileInfo);
        zip.addFile(rootInZip + rel.replaceAll("\\", "/"), buf);
    }

    zip.addFile(
        rootInZip + "manifest.json",
        Buffer.from(JSON.stringify(manifest, null, 2))
    );

    zip.writeZip(out);
    console.log("created", out);
    
    // 在verbose模式下输出详细的统计信息
    if (args.verbose) {
      console.log(`处理文件数: ${files.length}`);
      const totalSize = manifest.files.reduce((sum, file) => sum + file.size, 0);
      console.log(`总大小: ${(totalSize / 1024).toFixed(2)} KB`);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});