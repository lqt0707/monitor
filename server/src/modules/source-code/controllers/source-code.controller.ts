import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { SourceCodeParserService } from '../services/source-code-parser.service';
import { CodeIndexerService } from '../services/code-indexer.service';

@ApiTags('源码管理')
@Controller('source-code')
export class SourceCodeController {
  constructor(
    private readonly sourceCodeParser: SourceCodeParserService,
    private readonly codeIndexer: CodeIndexerService,
  ) {}

  /**
   * 索引项目源码
   */
  @Post('index')
  @ApiOperation({ summary: '索引项目源码' })
  @ApiBody({
    description: '项目路径',
    schema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: '项目路径' },
      },
      required: ['projectPath'],
    },
  })
  @ApiResponse({ status: 201, description: '项目源码索引成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  async indexProject(@Body() body: { projectPath: string }) {
    try {
      const { projectPath } = body;
      
      if (!projectPath) {
        throw new HttpException('项目路径不能为空', HttpStatus.BAD_REQUEST);
      }

      // 解析项目结构
      const projectStructure = await this.sourceCodeParser.parseProject(projectPath);
      
      // 索引项目代码
      await this.codeIndexer.indexProject(projectStructure);
      
      return {
        message: '项目源码索引成功',
        projectPath,
        totalFiles: projectStructure.files.length,
        framework: projectStructure.framework,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '项目源码索引失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 搜索源码
   */
  @Get('search')
  @ApiOperation({ summary: '搜索源码' })
  @ApiQuery({ name: 'query', description: '搜索查询', type: String })
  @ApiQuery({ name: 'framework', description: '框架过滤', type: String, required: false })
  @ApiQuery({ name: 'language', description: '语言过滤', type: String, required: false })
  @ApiQuery({ name: 'limit', description: '结果数量限制', type: Number, required: false })
  @ApiResponse({ status: 200, description: '搜索成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  async searchCode(
    @Query('query') query: string,
    @Query('framework') framework?: string,
    @Query('language') language?: string,
    @Query('limit') limit?: number,
  ) {
    try {
      if (!query) {
        throw new HttpException('搜索查询不能为空', HttpStatus.BAD_REQUEST);
      }

      const filters: Record<string, any> = {};
      if (framework) filters.framework = framework;
      if (language) filters.language = language;

      const results = await this.codeIndexer.searchCode(
        query,
        filters,
        limit || 10
      );

      return {
        message: '搜索成功',
        query,
        filters,
        total: results.length,
        results,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '源码搜索失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 获取项目索引状态
   */
  @Get('project/:projectPath/status')
  @ApiOperation({ summary: '获取项目索引状态' })
  @ApiParam({ name: 'projectPath', description: '项目路径', type: String })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '项目不存在' })
  async getProjectStatus(@Param('projectPath') projectPath: string) {
    try {
      const status = await this.codeIndexer.getProjectIndexStatus(projectPath);
      
      if (!status) {
        throw new HttpException('项目不存在', HttpStatus.NOT_FOUND);
      }

      return {
        message: '获取项目状态成功',
        status,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '获取项目状态失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 删除项目索引
   */
  @Delete('project/:projectPath')
  @ApiOperation({ summary: '删除项目索引' })
  @ApiParam({ name: 'projectPath', description: '项目路径', type: String })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '项目不存在' })
  async deleteProjectIndex(@Param('projectPath') projectPath: string) {
    try {
      await this.codeIndexer.deleteProjectIndex(projectPath);
      
      return {
        message: '项目索引删除成功',
        projectPath,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '删除项目索引失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 解析项目结构
   */
  @Post('parse')
  @ApiOperation({ summary: '解析项目结构' })
  @ApiBody({
    description: '项目路径',
    schema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: '项目路径' },
      },
      required: ['projectPath'],
    },
  })
  @ApiResponse({ status: 200, description: '解析成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async parseProject(@Body() body: { projectPath: string }) {
    try {
      const { projectPath } = body;
      
      if (!projectPath) {
        throw new HttpException('项目路径不能为空', HttpStatus.BAD_REQUEST);
      }

      const projectStructure = await this.sourceCodeParser.parseProject(projectPath);
      
      return {
        message: '项目结构解析成功',
        projectStructure,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '项目结构解析失败',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
