import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, IsOptional } from "class-validator";
import {
  SourcemapResolverService,
  ResolvedStackFrame,
} from "../services/sourcemap-resolver.service";
import { ErrorLogService } from "../error-log.service";
import { SourceCodeVersionService } from "../services/source-code-version.service";

// DTO 定义
class ResolveErrorLocationDto {
  @ApiProperty({ description: "项目ID" })
  @IsString()
  projectId: string;

  @ApiProperty({ description: "项目版本" })
  @IsString()
  projectVersion: string;

  @ApiProperty({ description: "文件名" })
  @IsString()
  fileName: string;

  @ApiProperty({ description: "行号" })
  @IsNumber()
  lineNumber: number;

  @ApiProperty({ description: "列号" })
  @IsNumber()
  columnNumber: number;

  @ApiProperty({ description: "错误堆栈", required: false })
  @IsOptional()
  @IsString()
  stackTrace?: string;
}

// 响应接口定义
interface SourceCodeResponse {
  content: string;
  contextLines: string[];
  errorLine: number;
}

@ApiTags("错误定位")
@Controller("error-location")
export class ErrorLocationController {
  constructor(
    private readonly sourcemapResolverService: SourcemapResolverService,
    private readonly errorLogService: ErrorLogService,
    private readonly sourceCodeVersionService: SourceCodeVersionService
  ) {}

  /**
   * 解析错误位置
   */
  @Post("resolve")
  @ApiOperation({ summary: "解析错误位置" })
  @ApiResponse({
    status: 200,
    description: "解析成功",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "object",
          properties: {
            resolvedFrames: { type: "array" },
            sourceCode: { type: "object" },
            originalError: { type: "object" },
          },
        },
      },
    },
  })
  async resolveErrorLocation(@Body() dto: ResolveErrorLocationDto) {
    try {
      // 解析错误堆栈
      const stackFrames = this.sourcemapResolverService.parseErrorStack(
        dto.stackTrace || ""
      );

      // 如果没有堆栈信息，使用传入的位置信息
      if (stackFrames.length === 0 && dto.fileName) {
        stackFrames.push({
          fileName: dto.fileName,
          lineNumber: dto.lineNumber,
          columnNumber: dto.columnNumber,
        });
      }

      // 解析每个堆栈帧
      const resolvedFrames =
        await this.sourcemapResolverService.resolveErrorStack(
          dto.projectId,
          dto.projectVersion,
          stackFrames
        );

      // 获取主要错误位置的源代码内容
      let sourceCode = null;
      const mainFrame = resolvedFrames[0];
      if (mainFrame?.originalSource) {
        // 这里暂时返回空的源代码内容，后续可以通过源代码版本服务获取
        sourceCode = {
          content: "", // TODO: 通过源代码版本服务获取实际内容
          contextLines: [],
          errorLine: mainFrame.originalLine || 0,
        };
      }

      return {
        success: true,
        data: {
          resolvedFrames,
          originalError: {
            fileName: dto.fileName || stackFrames[0]?.fileName || "",
            lineNumber: dto.lineNumber || stackFrames[0]?.lineNumber || 0,
            columnNumber: dto.columnNumber || stackFrames[0]?.columnNumber || 0,
          },
          sourceCode,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `解析错误位置失败: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * 获取错误的源代码
   */
  @Get("error/:errorId/source-code")
  @ApiOperation({ summary: "获取错误的源代码" })
  @ApiParam({ name: "errorId", description: "错误ID" })
  @ApiResponse({
    status: 200,
    description: "获取成功",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: {
          type: "object",
          properties: {
            resolvedFrames: { type: "array" },
            sourceCode: { type: "object" },
            originalError: { type: "object" },
          },
        },
      },
    },
  })
  async getErrorSourceCode(@Param("errorId") errorId: string) {
    try {
      // 获取错误日志
      const errorLog = await this.errorLogService.findErrorLogById(
        parseInt(errorId)
      );
      if (!errorLog) {
        return {
          success: false,
          message: "错误日志不存在",
        };
      }

      // 解析错误堆栈
      const stackFrames = this.sourcemapResolverService.parseErrorStack(
        errorLog.errorStack || ""
      );

      // 解析每个堆栈帧
      const resolvedFrames =
        await this.sourcemapResolverService.resolveErrorStack(
          errorLog.projectId,
          errorLog.projectVersion || "1.0.0",
          stackFrames
        );

      // 获取主要错误位置的源代码内容
      let sourceCode = null;
      const mainFrame = resolvedFrames[0];
      if (mainFrame?.originalSource) {
        // 这里暂时返回空的源代码内容，后续可以通过源代码版本服务获取
        sourceCode = {
          content: "", // TODO: 通过源代码版本服务获取实际内容
          contextLines: [],
          errorLine: mainFrame.originalLine || 0,
        };
      }

      return {
        success: true,
        data: {
          resolvedFrames,
          originalError: {
            fileName: errorLog.sourceFile || stackFrames[0]?.fileName || "",
            lineNumber: errorLog.sourceLine || stackFrames[0]?.lineNumber || 0,
            columnNumber:
              errorLog.sourceColumn || stackFrames[0]?.columnNumber || 0,
          },
          sourceCode,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `获取错误源代码失败: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * 获取源代码文件内容
   */
  @Get("source-code/:projectId/:version")
  @ApiOperation({ summary: "获取源代码文件内容" })
  @ApiParam({ name: "projectId", description: "项目ID" })
  @ApiParam({ name: "version", description: "版本号" })
  async getSourceCodeFile(
    @Param("projectId") projectId: string,
    @Param("version") version: string,
    @Body()
    body: { fileName: string; lineNumber?: number; contextSize?: number }
  ) {
    try {
      const { fileName, lineNumber, contextSize } = body;

      // 通过源代码版本服务获取文件内容
      const result = await this.sourceCodeVersionService.querySourceCodeFiles({
        projectId,
        version,
        fileName,
      });

      if (!result.success) {
        return {
          success: false,
          message: "获取源代码文件失败",
        };
      }

      // 处理源代码内容 - 暂时返回空内容，因为当前方法返回的是文件列表而不是文件内容
      return {
        success: true,
        data: {
          content: "// 源代码内容获取功能正在开发中",
          contextSize: contextSize || 5,
          contextLines: [],
          fileName: fileName,
          errorLine: lineNumber || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `获取源代码文件失败: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * 批量解析错误位置
   */
  @Post("batch-resolve")
  @ApiOperation({ summary: "批量解析错误位置" })
  async batchResolveErrorLocation(@Body() dtos: ResolveErrorLocationDto[]) {
    const results = [];

    for (const dto of dtos) {
      try {
        const result = await this.resolveErrorLocation(dto);
        results.push({
          input: dto,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          input: dto,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: results.every((r) => r.success),
      message: results.every((r) => r.success)
        ? "所有错误位置解析成功"
        : "部分错误位置解析失败",
      results,
    };
  }

  /**
   * 获取项目的 sourcemap 配置信息
   */
  @Get("project/:projectId/sourcemap-info")
  @ApiOperation({ summary: "获取项目的 sourcemap 配置信息" })
  @ApiParam({ name: "projectId", description: "项目ID" })
  async getProjectSourcemapInfo(@Param("projectId") projectId: string) {
    try {
      // 这里可以返回项目的 sourcemap 配置信息
      // 比如是否启用了 sourcemap，sourcemap 文件路径等
      return {
        success: true,
        data: {
          projectId,
          sourcemapEnabled: true, // TODO: 从项目配置获取
          sourcemapPath: `/storage/sourcemaps/${projectId}`, // TODO: 从项目配置获取
          availableVersions: [], // TODO: 获取可用的版本列表
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `获取项目 sourcemap 信息失败: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * 清理 sourcemap 缓存
   */
  @Post("clear-cache")
  @ApiOperation({ summary: "清理 sourcemap 缓存" })
  async clearSourcemapCache() {
    try {
      this.sourcemapResolverService.clearCache();
      return {
        success: true,
        message: "Sourcemap 缓存清理成功",
      };
    } catch (error) {
      return {
        success: false,
        message: `清理 sourcemap 缓存失败: ${error.message}`,
        error: error.message,
      };
    }
  }
}
