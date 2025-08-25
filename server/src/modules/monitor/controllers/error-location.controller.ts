import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import {
  SourcemapResolverService,
  ResolvedStackFrame,
} from "../services/sourcemap-resolver.service";
import { ErrorLogService } from "../error-log.service";
import { SourceCodeVersionService } from "../services/source-code-version.service";

export class ResolveErrorLocationDto {
  projectId: string;
  version: string;
  stackTrace: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
}

export class ErrorLocationResponse {
  success: boolean;
  data?: {
    resolvedFrames: ResolvedStackFrame[];
    originalError: {
      fileName: string;
      lineNumber: number;
      columnNumber: number;
    };
    sourceCode?: {
      content: string;
      contextLines: string[];
      errorLine: number;
    };
  };
  message?: string;
}

@ApiTags("错误定位")
@Controller("error-location")
@UseGuards(JwtAuthGuard)
export class ErrorLocationController {
  constructor(
    private readonly sourcemapResolverService: SourcemapResolverService,
    private readonly errorLogService: ErrorLogService,
    private readonly sourceCodeVersionService: SourceCodeVersionService
  ) {}

  @Post("resolve")
  @ApiOperation({ summary: "解析错误位置到源代码" })
  @ApiResponse({
    status: 200,
    description: "解析成功",
    type: ErrorLocationResponse,
  })
  async resolveErrorLocation(
    @Body() dto: ResolveErrorLocationDto
  ): Promise<ErrorLocationResponse> {
    try {
      // 解析错误堆栈
      const stackFrames = this.sourcemapResolverService.parseErrorStack(
        dto.stackTrace
      );

      // 解析到原始源代码位置
      const resolvedFrames =
        await this.sourcemapResolverService.resolveErrorStack(
          dto.projectId,
          dto.version,
          stackFrames
        );

      // 获取主要错误位置的源代码内容
      let sourceCode = null;
      const mainFrame = resolvedFrames[0];
      if (mainFrame?.originalSource && mainFrame?.sourceContent) {
        sourceCode = {
          content: mainFrame.sourceContent,
          contextLines: mainFrame.contextLines || [],
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
      };
    }
  }

  @Get("error/:errorId/source-code")
  @ApiOperation({ summary: "获取错误对应的源代码" })
  @ApiParam({ name: "errorId", description: "错误日志ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getErrorSourceCode(
    @Param("errorId") errorId: string
  ): Promise<ErrorLocationResponse> {
    try {
      // 获取错误日志详情
      const errorLog = await this.errorLogService.findErrorLogById(
        parseInt(errorId)
      );
      if (!errorLog) {
        return {
          success: false,
          message: "错误日志不存在",
        };
      }

      // 检查是否有版本信息
      if (!errorLog.projectVersion || !errorLog.projectId) {
        return {
          success: false,
          message: "错误日志缺少版本信息，无法定位源代码",
        };
      }

      // 解析错误堆栈
      const stackFrames = this.sourcemapResolverService.parseErrorStack(
        errorLog.errorStack || ""
      );

      // 如果没有堆栈信息，使用错误位置信息
      if (stackFrames.length === 0 && errorLog.sourceFile) {
        stackFrames.push({
          fileName: errorLog.sourceFile,
          lineNumber: errorLog.sourceLine || 0,
          columnNumber: errorLog.sourceColumn || 0,
        });
      }

      if (stackFrames.length === 0) {
        return {
          success: false,
          message: "无法获取错误位置信息",
        };
      }

      // 解析到原始源代码位置
      const resolvedFrames =
        await this.sourcemapResolverService.resolveErrorStack(
          errorLog.projectId,
          errorLog.projectVersion,
          stackFrames
        );

      // 获取源代码内容
      let sourceCode = null;
      const mainFrame = resolvedFrames[0];
      if (mainFrame?.originalSource && mainFrame?.sourceContent) {
        sourceCode = {
          content: mainFrame.sourceContent,
          contextLines: mainFrame.contextLines || [],
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
        message: `获取源代码失败: ${error.message}`,
      };
    }
  }

  @Get("source-code/:projectId/:version")
  @ApiOperation({ summary: "获取指定版本的源代码文件内容" })
  @ApiParam({ name: "projectId", description: "项目ID" })
  @ApiParam({ name: "version", description: "版本号" })
  @ApiQuery({ name: "filePath", description: "文件路径" })
  @ApiQuery({ name: "lineNumber", description: "行号", required: false })
  @ApiQuery({ name: "contextSize", description: "上下文行数", required: false })
  async getSourceCodeContent(
    @Param("projectId") projectId: string,
    @Param("version") version: string,
    @Query("filePath") filePath: string,
    @Query("lineNumber") lineNumber?: number,
    @Query("contextSize") contextSize?: number
  ) {
    try {
      // 调用 SourceCodeVersionService 来获取文件内容
      const result =
        await this.sourceCodeVersionService.getSourceCodeByLocation(
          projectId,
          version,
          filePath,
          lineNumber,
          contextSize || 5
        );

      if (!result.success) {
        return result;
      }

      // 如果指定了行号，提取上下文
      let content = result.data.content;
      let contextLines = [];

      if (lineNumber && content) {
        const lines = content.split("\n");
        const targetLine = Math.max(0, lineNumber - 1);
        const contextSizeNum = contextSize || 5;

        const startLine = Math.max(0, targetLine - contextSizeNum);
        const endLine = Math.min(lines.length - 1, targetLine + contextSizeNum);

        contextLines = lines
          .slice(startLine, endLine + 1)
          .map((line, index) => ({
            lineNumber: startLine + index + 1,
            content: line,
            isTarget: startLine + index === targetLine,
          }));
      }

      return {
        success: true,
        data: {
          filePath,
          content,
          lineNumber: lineNumber || 1,
          contextSize: contextSize || 5,
          contextLines,
          fileName: result.data.file.fileName,
          fileType: result.data.file.fileType,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `获取源代码内容失败: ${error.message}`,
      };
    }
  }

  @Post("batch-resolve")
  @ApiOperation({ summary: "批量解析多个错误的源代码位置" })
  @ApiResponse({ status: 200, description: "批量解析成功" })
  async batchResolveErrorLocation(
    @Body() dto: { errors: ResolveErrorLocationDto[] }
  ) {
    const results = [];

    for (const errorDto of dto.errors) {
      try {
        const result = await this.resolveErrorLocation(errorDto);
        results.push({
          ...errorDto,
          result,
        });
      } catch (error) {
        results.push({
          ...errorDto,
          result: {
            success: false,
            message: error.message,
          },
        });
      }
    }

    return {
      success: true,
      data: results,
    };
  }
}
