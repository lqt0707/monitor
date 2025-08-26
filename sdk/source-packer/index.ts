/**
 * Monitor SDK 源代码打包工具
 * 提供简化的API接口，让用户无需手动运行打包脚本
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

export interface PackOptions {
  /** 项目根目录，默认为当前工作目录 */
  projectRoot?: string;
  /** 输出目录，默认为 'source-code-package' */
  outputDir?: string;
  /** 是否创建压缩包，默认为 true */
  createZip?: boolean;
  /** 压缩包名称模式，默认自动生成 */
  zipName?: string;
  /** 是否启用详细日志，默认为 false */
  verbose?: boolean;
  /** 自定义配置文件路径 */
  configPath?: string;
  /** 打包模式：'basic' | 'advanced'，默认为 'basic' */
  mode?: "basic" | "advanced";
  /** 额外的文件包含模式 */
  includePatterns?: string[];
  /** 额外的文件排除模式 */
  excludePatterns?: string[];
}

export interface PackResult {
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 打包统计信息 */
  stats: {
    /** 文件总数 */
    totalFiles: number;
    /** 总大小（字节） */
    totalSize: number;
    /** 处理的文件数 */
    processedFiles: number;
    /** 跳过的文件数 */
    skippedFiles: number;
  };
  /** 输出路径信息 */
  output: {
    /** 输出目录路径 */
    directory: string;
    /** 压缩包路径（如果创建了压缩包） */
    zipPath?: string;
  };
  /** 打包耗时（毫秒） */
  duration: number;
}

/**
 * 源代码打包器类
 */
export class SourcePacker {
  private options: Required<PackOptions>;
  private startTime: number = 0;

  constructor(options: PackOptions = {}) {
    this.options = this.mergeDefaultOptions(options);
  }

  /**
   * 合并默认选项
   */
  private mergeDefaultOptions(options: PackOptions): Required<PackOptions> {
    return {
      projectRoot: options.projectRoot || process.cwd(),
      outputDir: options.outputDir || "source-code-package",
      createZip: options.createZip !== false,
      zipName: options.zipName || "",
      verbose: options.verbose || false,
      configPath: options.configPath || "",
      mode: options.mode || "basic",
      includePatterns: options.includePatterns || [],
      excludePatterns: options.excludePatterns || [],
    };
  }

  /**
   * 检测项目类型
   */
  private detectProjectType(): "web" | "taro" | "unknown" {
    const projectRoot = this.options.projectRoot;

    // 检查是否为 Taro 项目
    const taroConfigFiles = [
      "config/index.ts",
      "config/index.js",
      "project.config.json",
    ];

    for (const configFile of taroConfigFiles) {
      if (fs.existsSync(path.join(projectRoot, configFile))) {
        return "taro";
      }
    }

    // 检查 package.json 中的依赖
    const packageJsonPath = path.join(projectRoot, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf8")
        );
        const deps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        if (deps["@tarojs/cli"] || deps["@tarojs/taro"]) {
          return "taro";
        }

        if (deps["react"] || deps["vue"] || deps["@angular/core"]) {
          return "web";
        }
      } catch (error) {
        this.log("警告：无法解析 package.json", error);
      }
    }

    return "unknown";
  }

  /**
   * 日志输出
   */
  private log(message: string, ...args: any[]): void {
    if (this.options.verbose) {
      console.log(`[SourcePacker] ${message}`, ...args);
    }
  }

  /**
   * 获取打包脚本路径
   */
  private getPackerScriptPath(): string {
    // 从当前SDK目录向上查找examples目录
    let currentDir = __dirname;
    let examplesDir: string;
    
    // 向上查找直到找到examples目录
    while (currentDir !== path.dirname(currentDir)) {
      const possibleExamplesDir = path.join(currentDir, "examples");
      if (fs.existsSync(possibleExamplesDir)) {
        examplesDir = possibleExamplesDir;
        break;
      }
      currentDir = path.dirname(currentDir);
    }
    
    if (!examplesDir!) {
      // 如果找不到examples目录，尝试相对路径
      examplesDir = path.resolve(__dirname, "../../../examples");
    }

    // 根据项目类型选择对应的打包脚本
    const projectType = this.detectProjectType();
    let scriptDir: string;

    if (projectType === "taro") {
      scriptDir = path.join(examplesDir, "taro-mini");
    } else {
      // 默认使用 taro-mini 的脚本，因为它更通用
      scriptDir = path.join(examplesDir, "taro-mini");
    }

    const scriptName =
      this.options.mode === "advanced"
        ? "pack-source-advanced.js"
        : "pack-source-code.js";

    return path.join(scriptDir, scriptName);
  }

  /**
   * 创建临时配置文件
   */
  private createTempConfig(): string | null {
    if (
      this.options.includePatterns.length === 0 &&
      this.options.excludePatterns.length === 0
    ) {
      return null;
    }

    const tempConfigPath = path.join(
      this.options.projectRoot,
      ".temp-pack-config.json"
    );
    const config = {
      includePatterns: [
        "src/**/*",
        "config/**/*",
        "types/**/*",
        "*.json",
        "*.js",
        "*.ts",
        "*.md",
        ...this.options.includePatterns,
      ],
      excludePatterns: [
        "node_modules/**/*",
        ".git/**/*",
        "dist/**/*",
        "build/**/*",
        "*.log",
        ".DS_Store",
        "package-lock.json",
        "source-code-package/**/*",
        ...this.options.excludePatterns,
      ],
    };

    fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
    return tempConfigPath;
  }

  /**
   * 清理临时文件
   */
  private cleanupTempFiles(tempConfigPath: string | null): void {
    if (tempConfigPath && fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
  }

  /**
   * 执行打包
   */
  public async pack(): Promise<PackResult> {
    this.startTime = Date.now();
    let tempConfigPath: string | null = null;

    try {
      this.log("开始源代码打包...");
      this.log("项目根目录:", this.options.projectRoot);
      this.log("检测到项目类型:", this.detectProjectType());

      // 检查打包脚本是否存在
      const scriptPath = this.getPackerScriptPath();
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`打包脚本不存在: ${scriptPath}`);
      }

      this.log("使用打包脚本:", scriptPath);

      // 创建临时配置文件
      tempConfigPath = this.createTempConfig();
      if (tempConfigPath) {
        this.log("创建临时配置文件:", tempConfigPath);
      }

      // 构建命令参数
      const args: string[] = [];
      if (this.options.configPath) {
        args.push(`--config=${this.options.configPath}`);
      } else if (tempConfigPath) {
        args.push(`--config=${tempConfigPath}`);
      }

      if (this.options.verbose) {
        args.push("--verbose=true");
      }

      // 执行打包脚本
      const command = `node "${scriptPath}" ${args.join(" ")}`;
      this.log("执行命令:", command);

      const output = execSync(command, {
        cwd: this.options.projectRoot,
        encoding: "utf8",
        stdio: this.options.verbose ? "inherit" : "pipe",
      });

      // 解析输出结果
      const result = this.parsePackResult(output);

      this.log("打包完成，耗时:", Date.now() - this.startTime, "ms");

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.log("打包失败:", errorMessage);

      return {
        success: false,
        error: errorMessage,
        stats: {
          totalFiles: 0,
          totalSize: 0,
          processedFiles: 0,
          skippedFiles: 0,
        },
        output: {
          directory: path.join(
            this.options.projectRoot,
            this.options.outputDir
          ),
        },
        duration: Date.now() - this.startTime,
      };
    } finally {
      // 清理临时文件
      this.cleanupTempFiles(tempConfigPath);
    }
  }

  /**
   * 解析打包结果
   */
  private parsePackResult(output: string): PackResult {
    const outputDir = path.join(
      this.options.projectRoot,
      this.options.outputDir
    );

    // 尝试从输出中提取统计信息
    let totalFiles = 0;
    let totalSize = 0;
    let zipPath: string | undefined;

    // 安全的正则匹配来提取信息
    if (output && typeof output === 'string') {
      const fileCountMatch = output.match(/找到\s+(\d+)\s+个源代码文件/);
      if (fileCountMatch) {
        totalFiles = parseInt(fileCountMatch[1]);
      }

      const sizeMatch = output.match(/总大小:\s+([\d.]+)\s+KB/);
      if (sizeMatch) {
        totalSize = Math.round(parseFloat(sizeMatch[1]) * 1024);
      }

      const zipMatch = output.match(/压缩包创建成功:\s+(.+\.zip)/);
      if (zipMatch) {
        const zipFileName = zipMatch[1].trim();
        // 如果是绝对路径就直接使用，否则相对于项目根目录
        if (path.isAbsolute(zipFileName)) {
          zipPath = zipFileName;
        } else {
          zipPath = path.join(this.options.projectRoot, zipFileName);
        }
      }
    }

    return {
      success: true,
      stats: {
        totalFiles,
        totalSize,
        processedFiles: totalFiles,
        skippedFiles: 0,
      },
      output: {
        directory: outputDir,
        zipPath,
      },
      duration: Date.now() - this.startTime,
    };
  }
}

/**
 * 快速打包函数 - 主要API入口
 * @param options 打包选项
 * @returns 打包结果
 */
export async function packSourceCode(
  options: PackOptions = {}
): Promise<PackResult> {
  const packer = new SourcePacker(options);
  return await packer.pack();
}

/**
 * 获取推荐的打包配置
 * @param projectType 项目类型
 * @returns 推荐配置
 */
export function getRecommendedConfig(
  projectType?: "web" | "taro"
): PackOptions {
  const baseConfig: PackOptions = {
    createZip: true,
    verbose: false,
    mode: "basic",
  };

  if (projectType === "taro") {
    return {
      ...baseConfig,
      includePatterns: [
        "src/**/*",
        "config/**/*",
        "types/**/*",
        "project.config.json",
        "project.private.config.json",
      ],
      excludePatterns: ["dist/**/*", "node_modules/**/*", ".temp/**/*"],
    };
  }

  if (projectType === "web") {
    return {
      ...baseConfig,
      includePatterns: ["src/**/*", "public/**/*", "config/**/*", "types/**/*"],
      excludePatterns: [
        "build/**/*",
        "dist/**/*",
        "node_modules/**/*",
        "coverage/**/*",
      ],
    };
  }

  return baseConfig;
}

// 默认导出
export default {
  packSourceCode,
  SourcePacker,
  getRecommendedConfig,
};
