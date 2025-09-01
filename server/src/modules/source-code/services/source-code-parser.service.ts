import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface ParsedFile {
  filePath: string;
  content: string;
  functions: FunctionInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  dependencies: string[];
}

export interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  params: string[];
  body: string;
  async: boolean;
  generator: boolean;
}

export interface ImportInfo {
  source: string;
  specifiers: string[];
  default: string | null;
}

export interface ExportInfo {
  name: string;
  type: 'default' | 'named' | 'all';
  value?: string;
}

export interface ProjectStructure {
  root: string;
  files: ParsedFile[];
  dependencies: string[];
  framework: string;
  buildConfig: any;
}

@Injectable()
export class SourceCodeParserService {
  private readonly logger = new Logger(SourceCodeParserService.name);

  /**
   * 解析项目结构
   */
  async parseProject(projectPath: string): Promise<ProjectStructure> {
    try {
      this.logger.log(`开始解析项目: ${projectPath}`);
      
      const structure: ProjectStructure = {
        root: projectPath,
        files: [],
        dependencies: [],
        framework: this.detectFramework(projectPath),
        buildConfig: await this.parseBuildConfig(projectPath),
      };

      // 递归解析项目文件
      await this.parseDirectory(projectPath, structure.files);
      
      // 解析依赖关系
      structure.dependencies = await this.parseDependencies(projectPath);
      
      this.logger.log(`项目解析完成: ${structure.files.length} 个文件`);
      return structure;
    } catch (error) {
      this.logger.error(`项目解析失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 解析单个文件
   */
  async parseFile(filePath: string): Promise<ParsedFile> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const ext = path.extname(filePath);
      
      if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        return await this.parseJavaScriptFile(filePath, content);
      }
      
      return {
        filePath,
        content,
        functions: [],
        imports: [],
        exports: [],
        dependencies: [],
      };
    } catch (error) {
      this.logger.error(`文件解析失败: ${filePath}`, error.stack);
      throw error;
    }
  }

  /**
   * 解析JavaScript/TypeScript文件
   */
  private async parseJavaScriptFile(filePath: string, content: string): Promise<ParsedFile> {
    try {
      // 简化的解析逻辑，不依赖Babel
      const functions: FunctionInfo[] = [];
      const imports: ImportInfo[] = [];
      const exports: ExportInfo[] = [];
      const dependencies: string[] = [];

      const lines = content.split('\n');
      
      // 简单的函数检测
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 检测函数声明
        if (line.match(/function\s+(\w+)\s*\(/)) {
          const match = line.match(/function\s+(\w+)\s*\(/);
          if (match) {
            const funcName = match[1];
            const startLine = i + 1;
            let endLine = startLine;
            
            // 查找函数结束位置
            let braceCount = 0;
            let inFunction = false;
            
            for (let j = i; j < lines.length; j++) {
              const currentLine = lines[j];
              if (currentLine.includes('{')) {
                if (!inFunction) inFunction = true;
                braceCount++;
              }
              if (currentLine.includes('}')) {
                braceCount--;
                if (braceCount === 0 && inFunction) {
                  endLine = j + 1;
                  break;
                }
              }
            }
            
            functions.push({
              name: funcName,
              startLine,
              endLine,
              params: this.extractParams(line),
              body: lines.slice(startLine - 1, endLine).join('\n'),
              async: line.includes('async'),
              generator: line.includes('*'),
            });
          }
        }
        
        // 检测箭头函数
        if (line.match(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/)) {
          const match = line.match(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/);
          if (match) {
            const funcName = match[1];
            const startLine = i + 1;
            let endLine = startLine;
            
            // 查找箭头函数结束位置
            if (line.includes('{')) {
              let braceCount = 1;
              for (let j = i + 1; j < lines.length; j++) {
                const currentLine = lines[j];
                if (currentLine.includes('{')) braceCount++;
                if (currentLine.includes('}')) {
                  braceCount--;
                  if (braceCount === 0) {
                    endLine = j + 1;
                    break;
                  }
                }
              }
            } else {
              // 单行箭头函数
              endLine = startLine;
            }
            
            functions.push({
              name: funcName,
              startLine,
              endLine,
              params: this.extractParams(line),
              body: lines.slice(startLine - 1, endLine).join('\n'),
              async: line.includes('async'),
              generator: false,
            });
          }
        }
        
        // 检测import语句
        if (line.match(/import\s+.*from\s+['"]([^'"]+)['"]/)) {
          const match = line.match(/import\s+.*from\s+['"]([^'"]+)['"]/);
          if (match) {
            const source = match[1];
            const specifiers: string[] = [];
            
            // 提取导入的标识符
            if (line.includes('{')) {
              const braceMatch = line.match(/\{([^}]+)\}/);
              if (braceMatch) {
                specifiers.push(...braceMatch[1].split(',').map(s => s.trim()));
              }
            } else if (line.includes('import')) {
              const defaultMatch = line.match(/import\s+(\w+)/);
              if (defaultMatch) {
                specifiers.push(defaultMatch[1]);
              }
            }
            
            imports.push({
              source,
              specifiers,
              default: specifiers.length > 0 ? specifiers[0] : null,
            });
          }
        }
        
        // 检测export语句
        if (line.match(/export\s+(default\s+)?(function|const|class)\s+(\w+)/)) {
          const match = line.match(/export\s+(default\s+)?(function|const|class)\s+(\w+)/);
          if (match) {
            const isDefault = !!match[1];
            const funcName = match[3];
            
            exports.push({
              name: funcName,
              type: isDefault ? 'default' : 'named',
              value: line,
            });
          }
        }
      }

      return {
        filePath,
        content,
        functions,
        imports,
        exports,
        dependencies,
      };
    } catch (error) {
      this.logger.error(`JavaScript文件解析失败: ${filePath}`, error.stack);
      throw error;
    }
  }

  /**
   * 提取函数参数
   */
  private extractParams(line: string): string[] {
    const paramMatch = line.match(/\(([^)]*)\)/);
    if (!paramMatch) return [];
    
    return paramMatch[1]
      .split(',')
      .map(param => param.trim())
      .filter(param => param.length > 0)
      .map(param => {
        // 处理解构参数和默认值
        if (param.includes('=')) {
          return param.split('=')[0].trim();
        }
        if (param.includes(':')) {
          return param.split(':')[0].trim();
        }
        return param;
      });
  }

  /**
   * 检测前端框架
   */
  private detectFramework(projectPath: string): string {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (dependencies['@tarojs/taro']) return 'Taro';
        if (dependencies['react']) return 'React';
        if (dependencies['vue']) return 'Vue';
        if (dependencies['angular']) return 'Angular';
      } catch (error) {
        this.logger.warn(`package.json解析失败: ${packageJsonPath}`);
      }
    }
    
    return 'Unknown';
  }

  /**
   * 解析构建配置
   */
  private async parseBuildConfig(projectPath: string): Promise<any> {
    const configFiles = ['webpack.config.js', 'vite.config.js', 'rollup.config.js', 'babel.config.js'];
    
    for (const configFile of configFiles) {
      const configPath = path.join(projectPath, configFile);
      if (fs.existsSync(configPath)) {
        try {
          return require(configPath);
        } catch (error) {
          this.logger.warn(`配置文件解析失败: ${configPath}`);
        }
      }
    }
    
    return null;
  }

  /**
   * 递归解析目录
   */
  private async parseDirectory(dirPath: string, files: ParsedFile[]): Promise<void> {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过node_modules等目录
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          await this.parseDirectory(fullPath, files);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (['.js', '.jsx', '.ts', '.tsx', '.vue'].includes(ext)) {
          try {
            const parsedFile = await this.parseFile(fullPath);
            files.push(parsedFile);
          } catch (error) {
            this.logger.warn(`文件解析跳过: ${fullPath}`);
          }
        }
      }
    }
  }

  /**
   * 解析依赖关系
   */
  private async parseDependencies(projectPath: string): Promise<string[]> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        return [
          ...Object.keys(packageJson.dependencies || {}),
          ...Object.keys(packageJson.devDependencies || {}),
        ];
      } catch (error) {
        this.logger.warn(`package.json解析失败: ${packageJsonPath}`);
      }
    }
    
    return [];
  }
}
