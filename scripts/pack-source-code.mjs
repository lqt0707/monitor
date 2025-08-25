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
];

// 默认排除（可按需扩展）
const EXCLUDES = [
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**",
    "**/build/**",
    "**/coverage/**",
    "**/*.log",
    "**/.DS_Store",
    "**/.env",
    "**/.env.*",
    "**/package-lock.json",
    "**/yarn.lock",
];

function md5(buf) {
    return crypto.createHash("md5").update(buf).digest("hex");
}

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
    };
    return map[ext] || (TXT_EXT.includes(ext) ? "text" : "binary");
}

async function main() {
    // 简单参数解析：--projectId=xxx --version=yyy --out=zzz.zip --cwd=dir
    const args = Object.fromEntries(
        process.argv
            .slice(2)
            .map((s) => s.split("="))
            .map(([k, v]) => [k.replace(/^--/, ""), v ?? true])
    );

    const projectId = args.projectId || args.p;
    const version = args.version || args.v;
    const workdir = args.cwd ? path.resolve(args.cwd) : root;

    if (!projectId || !version) {
        console.error("缺少参数：--projectId 与 --version");
        process.exit(1);
    }

    const out =
        args.out ||
        path.join(root, "dist", `${projectId}-${version}.zip`);

    fs.mkdirSync(path.dirname(out), { recursive: true });

    const zip = new AdmZip();
    const rootInZip = `${projectId}-${version}/`;

    const includes = ["**/*"];
    const files = await globby(includes, {
        cwd: workdir,
        dot: true,
        ignore: EXCLUDES,
        onlyFiles: true,
        followSymbolicLinks: false,
    });

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
        manifest.files.push({
            path: rel.replaceAll("\\", "/"),
            size: buf.length,
            md5: md5(buf),
            type,
            text: isText,
        });
        zip.addFile(rootInZip + rel.replaceAll("\\", "/"), buf);
    }

    zip.addFile(
        rootInZip + "manifest.json",
        Buffer.from(JSON.stringify(manifest, null, 2))
    );

    zip.writeZip(out);
    console.log("created", out);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});