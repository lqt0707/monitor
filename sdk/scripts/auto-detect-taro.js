#!/usr/bin/env node

/**
 * Taro项目智能检测脚本
 * 自动识别Taro项目类型、框架、配置状态，并生成相应的监控配置
 */

import fs from "fs";
import path from "path";

// 颜色输出
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
};

// 日志函数
function logInfo(message) {
  console.log(colors.blue("ℹ"), message);
}

function logSuccess(message) {
  console.log(colors.green("✓"), message);
}

function logWarning(message) {
  console.log(colors.yellow("⚠"), message);
}

function logError(message) {
  console.log(colors.red("✗"), message);
}

function logDetail(message) {
  console.log(colors.magenta("↳"), message);
}

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// 读取JSON文件
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

// 读取文件内容
function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    return "";
  }
}

// 检测项目类型
function detectProjectType() {
  logInfo("正在分析项目类型...");

  const packageJsonPath = path.join(process.cwd(), "package.json");
  if (!fileExists(packageJsonPath)) {
    logError("未找到package.json文件");
    return null;
  }

  const packageJson = readJsonFile(packageJsonPath);
  if (!packageJson) {
    logError("无法读取package.json文件");
    return null;
  }

  const result = {
    isTaro: false,
    framework: null,
    typescript: false,
    hasSourcemap: false,
    hasMonitorSDK: false,
    buildConfig: {},
    dependencies: {},
  };

  // 检测Taro项目
  if (packageJson.dependencies) {
    result.isTaro = !!(
      packageJson.dependencies["@tarojs/taro"] ||
      packageJson.dependencies["@tarojs/cli"] ||
      packageJson.dependencies["@tarojs/components"]
    );

    // 检测框架
    if (packageJson.dependencies["@tarojs/react"]) {
      result.framework = "react";
    } else if (packageJson.dependencies["@tarojs/vue"]) {
      result.framework = "vue";
    } else if (packageJson.dependencies["@tarojs/vue3"]) {
      result.framework = "vue3";
    }

    // 检测监控SDK
    result.hasMonitorSDK = !!packageJson.dependencies["@monitor/sdk"];
  }

  // 检测TypeScript
  result.typescript = !!(
    packageJson.devDependencies &&
    (packageJson.devDependencies["typescript"] ||
      packageJson.devDependencies["@types/node"])
  );

  // 检测构建配置
  const configPath = path.join(process.cwd(), "config");
  if (fileExists(configPath)) {
    const configFiles = fs.readdirSync(configPath);
    result.buildConfig.hasConfig = configFiles.length > 0;
    result.buildConfig.files = configFiles;

    // 检测sourcemap配置
    const indexConfigPath = path.join(configPath, "index.ts");
    if (fileExists(indexConfigPath)) {
      const configContent = readFileContent(indexConfigPath);
      result.hasSourcemap =
        configContent.includes("source-map") ||
        configContent.includes("sourceMap") ||
        configContent.includes("devtool");
    }
  }

  // 检测构建脚本
  const buildScriptPath = path.join(process.cwd(), "build-with-sourcemap.sh");
  result.buildConfig.hasBuildScript = fileExists(buildScriptPath);

  return result;
}

// 生成配置建议
function generateConfigurationSuggestions(projectInfo) {
  const suggestions = [];

  if (!projectInfo.isTaro) {
    suggestions.push({
      type: "error",
      message: "当前项目不是Taro项目",
      action: "请在Taro项目根目录运行此脚本",
    });
    return suggestions;
  }

  logSuccess(`检测到Taro项目 (${projectInfo.framework || "未知框架"})`);

  // 配置检查
  if (!projectInfo.buildConfig.hasConfig) {
    suggestions.push({
      type: "config",
      message: "缺少Taro构建配置文件",
      action: "需要创建config目录和配置文件",
      priority: "high",
    });
  }

  if (!projectInfo.hasSourcemap) {
    suggestions.push({
      type: "sourcemap",
      message: "未配置sourcemap生成",
      action: "需要在webpack配置中添加devtool: source-map",
      priority: "high",
    });
  }

  if (!projectInfo.buildConfig.hasBuildScript) {
    suggestions.push({
      type: "script",
      message: "缺少自动化构建脚本",
      action: "需要创建build-with-sourcemap.sh脚本",
      priority: "medium",
    });
  }

  if (!projectInfo.hasMonitorSDK) {
    suggestions.push({
      type: "sdk",
      message: "未安装监控SDK",
      action: "需要安装@monitor/sdk依赖",
      priority: "medium",
    });
  }

  // 框架特定建议
  if (projectInfo.framework === "react") {
    suggestions.push({
      type: "framework",
      message: "React框架检测",
      action: "建议在app.tsx中初始化监控SDK",
      priority: "low",
    });
  } else if (
    projectInfo.framework === "vue" ||
    projectInfo.framework === "vue3"
  ) {
    suggestions.push({
      type: "framework",
      message: "Vue框架检测",
      action: "建议在app.vue中初始化监控SDK",
      priority: "low",
    });
  }

  return suggestions;
}

// 生成自动化配置命令
function generateAutoConfigCommands(suggestions) {
  const commands = [];

  suggestions.forEach((suggestion) => {
    switch (suggestion.type) {
      case "config":
        commands.push({
          command: "npx @monitor/sdk auto-config-taro",
          description: "自动创建Taro构建配置文件",
        });
        break;

      case "sourcemap":
        commands.push({
          command:
            'echo "配置sourcemap: 在config/index.ts中添加 chain.devtool(\"source-map\")"',
          description: "手动配置sourcemap生成",
        });
        break;

      case "script":
        commands.push({
          command:
            "cp node_modules/@monitor/sdk/scripts/build-with-sourcemap.sh . && chmod +x build-with-sourcemap.sh",
          description: "复制构建脚本并设置权限",
        });
        break;

      case "sdk":
        commands.push({
          command: "npm install @monitor/taro-sdk",
          description: "安装监控SDK",
        });
        break;
    }
  });

  return commands;
}

// 显示检测结果
function displayDetectionResults(projectInfo, suggestions, commands) {
  console.log();
  console.log(colors.cyan("📊 项目检测报告"));
  console.log(colors.cyan("==============="));
  console.log();

  // 项目基本信息
  console.log(colors.blue("项目信息:"));
  logDetail(
    `Taro项目: ${projectInfo.isTaro ? colors.green("是") : colors.red("否")}`,
  );
  logDetail(`框架: ${projectInfo.framework || colors.yellow("未知")}`);
  logDetail(
    `TypeScript: ${projectInfo.typescript ? colors.green("是") : colors.yellow("否")}`,
  );
  logDetail(
    `监控SDK: ${projectInfo.hasMonitorSDK ? colors.green("已安装") : colors.yellow("未安装")}`,
  );
  logDetail(
    `构建配置: ${projectInfo.buildConfig.hasConfig ? colors.green("已配置") : colors.red("未配置")}`,
  );
  logDetail(
    `Sourcemap: ${projectInfo.hasSourcemap ? colors.green("已启用") : colors.red("未启用")}`,
  );
  logDetail(
    `构建脚本: ${projectInfo.buildConfig.hasBuildScript ? colors.green("已存在") : colors.red("未配置")}`,
  );
  console.log();

  // 配置建议
  if (suggestions.length > 0) {
    console.log(colors.blue("配置建议:"));
    suggestions.forEach((suggestion, index) => {
      const priorityIcon =
        suggestion.priority === "high"
          ? "🔴"
          : suggestion.priority === "medium"
            ? "🟡"
            : "🟢";
      console.log(
        `${priorityIcon} [${suggestion.type.toUpperCase()}] ${suggestion.message}`,
      );
      logDetail(`建议: ${suggestion.action}`);
    });
    console.log();
  }

  // 自动化命令
  if (commands.length > 0) {
    console.log(colors.blue("自动化配置命令:"));
    commands.forEach((cmd, index) => {
      console.log(`${index + 1}. ${colors.cyan(cmd.command)}`);
      logDetail(`${cmd.description}`);
    });
    console.log();
  }

  // 总结
  const configScore = calculateConfigScore(projectInfo, suggestions);
  console.log(colors.blue("配置完整度:"));
  logDetail(`评分: ${configScore}/100 ${getScoreEmoji(configScore)}`);

  if (configScore >= 80) {
    logSuccess("项目配置良好，可以开始监控！");
  } else if (configScore >= 50) {
    logWarning("项目配置需要优化，建议执行上述配置命令");
  } else {
    logError("项目配置不完整，需要执行关键配置");
  }
}

// 计算配置评分
function calculateConfigScore(projectInfo, suggestions) {
  let score = 100;

  // 关键配置缺失扣分
  if (!projectInfo.buildConfig.hasConfig) score -= 30;
  if (!projectInfo.hasSourcemap) score -= 25;
  if (!projectInfo.buildConfig.hasBuildScript) score -= 20;
  if (!projectInfo.hasMonitorSDK) score -= 15;
  if (!projectInfo.framework) score -= 10;

  return Math.max(0, score);
}

// 获取评分表情
function getScoreEmoji(score) {
  if (score >= 80) return "🎉";
  if (score >= 50) return "⚠️";
  return "❌";
}

// 主函数
function main() {
  console.log(colors.cyan("🔍 Taro项目智能检测工具"));
  console.log(colors.cyan("========================"));
  console.log();

  // 检测项目信息
  const projectInfo = detectProjectType();
  if (!projectInfo) {
    process.exit(1);
  }

  // 生成建议
  const suggestions = generateConfigurationSuggestions(projectInfo);
  const commands = generateAutoConfigCommands(suggestions);

  // 显示结果
  displayDetectionResults(projectInfo, suggestions, commands);

  console.log();
  console.log(colors.cyan("💡 使用说明:"));
  console.log("1. 运行检测命令: npx @monitor/sdk auto-detect-taro");
  console.log("2. 根据建议执行相应的配置命令");
  console.log("3. 重新运行检测验证配置结果");
  console.log();
}

// 执行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  detectProjectType,
  generateConfigurationSuggestions,
  generateAutoConfigCommands,
  calculateConfigScore,
};
