import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { AiDiagnosisService } from "../../../services/ai-diagnosis.service";

/**
 * AI诊断控制器
 * 提供错误诊断的REST API接口
 */
@ApiTags("AI诊断")
@Controller("ai-diagnosis")
export class AiDiagnosisController {
  private readonly logger = new Logger(AiDiagnosisController.name);

  constructor(private readonly aiDiagnosisService: AiDiagnosisService) {}

  /**
   * 获取错误日志的AI诊断结果
   * @param errorId 错误日志ID
   * @returns AI诊断结果
   */
  @Get("error/:errorId")
  @ApiOperation({ summary: "获取错误日志的AI诊断结果" })
  @ApiParam({ name: "errorId", description: "错误日志ID", type: Number })
  @ApiResponse({ status: 200, description: "诊断结果获取成功" })
  @ApiResponse({ status: 404, description: "诊断结果不存在" })
  async getErrorDiagnosis(@Param("errorId") errorId: number) {
    try {
      const result = await this.aiDiagnosisService.getErrorDiagnosis(errorId);
      if (!result) {
        throw new HttpException("诊断结果不存在", HttpStatus.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || "获取诊断结果失败",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取错误聚合的AI诊断结果
   * @param aggregationId 错误聚合ID
   * @returns AI诊断结果
   */
  @Get("aggregation/:aggregationId")
  @ApiOperation({ summary: "获取错误聚合的AI诊断结果" })
  @ApiParam({ name: "aggregationId", description: "错误聚合ID", type: Number })
  @ApiResponse({ status: 200, description: "诊断结果获取成功" })
  @ApiResponse({ status: 404, description: "诊断结果不存在" })
  async getAggregationDiagnosis(@Param("aggregationId") aggregationId: number) {
    try {
      const result =
        await this.aiDiagnosisService.getAggregationDiagnosis(aggregationId);
      if (!result) {
        throw new HttpException("诊断结果不存在", HttpStatus.NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || "获取诊断结果失败",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 触发错误日志的AI诊断分析
   * @param errorId 错误日志ID
   * @returns 诊断任务ID
   */
  @Post("error/:errorId/analyze")
  @ApiOperation({ summary: "触发错误日志的AI诊断分析" })
  @ApiParam({ name: "errorId", description: "错误日志ID", type: Number })
  @ApiResponse({ status: 201, description: "诊断任务已创建" })
  async triggerDiagnosis(@Param("errorId") errorId: number) {
    try {
      const taskId =
        await this.aiDiagnosisService.triggerErrorDiagnosis(errorId);
      return { taskId };
    } catch (error) {
      throw new HttpException(
        error.message || "触发诊断失败",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取诊断任务状态
   * @param taskId 诊断任务ID
   * @returns 任务状态
   */
  @Get("task/:taskId")
  @ApiOperation({ summary: "获取诊断任务状态" })
  @ApiParam({ name: "taskId", description: "诊断任务ID", type: String })
  @ApiResponse({ status: 200, description: "任务状态获取成功" })
  @ApiResponse({ status: 404, description: "任务不存在" })
  async getDiagnosisStatus(@Param("taskId") taskId: string) {
    try {
      const status = await this.aiDiagnosisService.getDiagnosisStatus(taskId);
      if (!status) {
        throw new HttpException("任务不存在", HttpStatus.NOT_FOUND);
      }
      return status;
    } catch (error) {
      throw new HttpException(
        error.message || "获取任务状态失败",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 生成综合分析报告
   * @param body 综合分析请求数据
   * @returns 综合分析报告
   */
  @Post("comprehensive-analysis")
  @ApiOperation({ summary: "生成综合分析报告" })
  @ApiBody({
    description: "综合分析请求数据",
    schema: {
      type: "object",
      properties: {
        errorId: { type: "number", description: "错误ID" },
        errorMessage: { type: "string", description: "错误消息" },
        errorStack: { type: "string", description: "错误堆栈" },
        sourceFile: { type: "string", description: "源文件" },
        sourceLine: { type: "number", description: "源行号" },
        projectVersion: { type: "string", description: "项目版本" },
        aiDiagnosis: { type: "object", description: "AI诊断结果" },
        sourceCode: { type: "object", description: "源代码信息" },
        timestamp: { type: "string", description: "时间戳" },
      },
    },
  })
  @ApiResponse({ status: 201, description: "综合分析报告生成成功" })
  @ApiResponse({ status: 400, description: "请求参数错误" })
  @ApiResponse({ status: 500, description: "服务器内部错误" })
  async generateComprehensiveAnalysis(@Body() analysisData: any) {
    try {
      const report =
        await this.aiDiagnosisService.generateComprehensiveAnalysis(
          analysisData
        );
      return report;
    } catch (error) {
      throw new HttpException(
        error.message || "生成综合分析报告失败",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取综合分析报告
   * @param errorId 错误ID
   * @returns 综合分析报告
   */
  @Get("comprehensive-analysis/:errorId")
  @ApiOperation({ summary: "获取综合分析报告" })
  @ApiParam({ name: "errorId", description: "错误ID", type: Number })
  @ApiResponse({ status: 200, description: "获取综合分析报告成功" })
  @ApiResponse({ status: 404, description: "综合分析报告不存在" })
  @ApiResponse({ status: 500, description: "服务器内部错误" })
  async getComprehensiveAnalysisReport(@Param("errorId") errorId: number) {
    try {
      const report =
        await this.aiDiagnosisService.getComprehensiveAnalysisReport(errorId);
      if (!report) {
        throw new HttpException("综合分析报告不存在", HttpStatus.NOT_FOUND);
      }
      return report;
    } catch (error) {
      throw new HttpException(
        error.message || "获取综合分析报告失败",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 执行RAG增强错误分析
   * @param body RAG分析请求数据
   * @returns RAG分析结果
   */
  @Post("rag-analysis")
  @ApiOperation({ summary: "执行RAG增强错误分析" })
  @ApiBody({
    description: "RAG分析请求数据",
    schema: {
      type: "object",
      properties: {
        errorId: { type: "string", description: "错误ID" },
        errorContext: {
          type: "object",
          properties: {
            errorMessage: { type: "string", description: "错误消息" },
            stackTrace: { type: "string", description: "错误堆栈" },
            projectPath: { type: "string", description: "项目路径" },
            framework: { type: "string", description: "前端框架" },
            sourceMapDir: { type: "string", description: "SourceMap目录" },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "RAG分析完成" })
  @ApiResponse({ status: 400, description: "请求参数错误" })
  @ApiResponse({ status: 500, description: "服务器内部错误" })
  async performRAGAnalysis(@Body() ragRequest: any) {
    try {
      const result = await this.aiDiagnosisService.performRAGErrorAnalysis(
        ragRequest.errorId,
        ragRequest.errorContext
      );
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || "RAG分析失败",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取RAG分析历史
   * @returns RAG分析历史列表
   */
  @Get("rag-analysis/history")
  @ApiOperation({ summary: "获取RAG分析历史" })
  @ApiResponse({ status: 200, description: "获取RAG分析历史成功" })
  @ApiResponse({ status: 500, description: "服务器内部错误" })
  async getRAGAnalysisHistory() {
    try {
      const history = await this.aiDiagnosisService.getRAGAnalysisHistory();
      // 即使没有历史记录也返回空数组，不抛出错误
      return history || [];
    } catch (error) {
      this.logger.error("获取RAG分析历史失败:", error);
      // 返回空数组而不是抛出错误
      return [];
    }
  }

  /**
   * 获取RAG分析结果
   * @param analysisId 分析ID
   * @returns RAG分析结果
   */
  @Get("rag-analysis/:analysisId")
  @ApiOperation({ summary: "获取RAG分析结果" })
  @ApiParam({ name: "analysisId", description: "分析ID", type: "string" })
  @ApiResponse({ status: 200, description: "获取RAG分析结果成功" })
  @ApiResponse({ status: 404, description: "RAG分析结果不存在" })
  @ApiResponse({ status: 500, description: "服务器内部错误" })
  async getRAGAnalysisResult(@Param("analysisId") analysisId: string) {
    try {
      const result =
        await this.aiDiagnosisService.getRAGAnalysisResult(analysisId);
      if (!result) {
        // 返回404状态码，但不抛出异常
        return {
          statusCode: 404,
          message: "RAG分析结果不存在",
          data: null,
        };
      }
      return result;
    } catch (error) {
      this.logger.error(`获取RAG分析结果失败: ${analysisId}`, error);
      return {
        statusCode: 500,
        message: "获取RAG分析结果失败",
        data: null,
      };
    }
  }
}
