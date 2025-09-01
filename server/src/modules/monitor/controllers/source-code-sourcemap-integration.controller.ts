import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  HttpException,
  Req,
} from '@nestjs/common';
import * as fs from 'fs';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { SourceCodeSourcemapIntegrationService } from '../services/source-code-sourcemap-integration.service';

/**
 * 源代码与Sourcemap集成控制器
 * 负责处理源代码和sourcemap压缩包的上传API
 */
@ApiTags('源代码与Sourcemap集成')
@Controller('source-code-sourcemap-integration')
export class SourceCodeSourcemapIntegrationController {
  constructor(
    private readonly integrationService: SourceCodeSourcemapIntegrationService
  ) {}



  /**
   * 上传源代码和sourcemap压缩包
   */
  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'sourceCodeArchive', maxCount: 1 },
    { name: 'sourcemapArchive', maxCount: 1 }
  ]))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '上传源代码和sourcemap压缩包',
    description: '同时上传项目的源代码压缩包和sourcemap压缩包，并建立关联关系'
  })
  @ApiBody({
    description: '源代码和sourcemap压缩包上传',
    schema: {
      type: 'object',
      required: ['sourceCodeArchive', 'sourcemapArchive', 'projectId', 'version'],
      properties: {
        sourceCodeArchive: {
          type: 'string',
          format: 'binary',
          description: '源代码压缩包文件'
        },
        sourcemapArchive: {
          type: 'string',
          format: 'binary',
          description: 'sourcemap压缩包文件'
        },
        projectId: { type: 'string', description: '项目ID' },
        version: { type: 'string', description: '版本号' },
        buildId: { type: 'string', description: '构建ID' },
        branchName: { type: 'string', description: '分支名称' },
        commitMessage: { type: 'string', description: '提交信息' },
        uploadedBy: { type: 'string', description: '上传者' },
        description: { type: 'string', description: '描述' },
        setAsActive: { type: 'boolean', description: '是否设置为活跃版本' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '源代码和sourcemap上传成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '源代码和sourcemap上传成功' },
        sourceCodeVersionId: { type: 'number', example: 1 },
        sourceCodeFileCount: { type: 'number', example: 50 },
        sourcemapProcessedCount: { type: 'number', example: 8 },
        sourcemapErrorCount: { type: 'number', example: 0 }
      }
    }
  })
  async uploadSourceCodeAndSourcemap(
    @UploadedFiles() files: { sourceCodeArchive?: any[], sourcemapArchive?: any[] },
    @Req() request: any,
    @Body('projectId') projectId: string,
    @Body('version') version: string,
    @Body('buildId') buildId?: string,
    @Body('branchName') branchName?: string,
    @Body('commitMessage') commitMessage?: string,
    @Body('uploadedBy') uploadedBy?: string,
    @Body('description') description?: string,
    @Body('setAsActive') setAsActive?: boolean
  ) {
    const sourceCodeFile = files.sourceCodeArchive?.[0];
    const sourcemapFile = files.sourcemapArchive?.[0];

    if (!sourceCodeFile || !sourcemapFile) {
      throw new HttpException('必须上传两个压缩包文件：源代码和sourcemap', HttpStatus.BAD_REQUEST);
    }

    // 调试文件对象结构
    console.log('sourceCodeFile:', sourceCodeFile);
    console.log('sourcemapFile:', sourcemapFile);

    if (!projectId) {
      throw new HttpException('项目ID不能为空', HttpStatus.BAD_REQUEST);
    }

    if (!version) {
      throw new HttpException('版本号不能为空', HttpStatus.BAD_REQUEST);
    }

    // 读取文件内容为Buffer（Multer保存到磁盘后，文件对象没有buffer属性）
    const sourceCodeBuffer = fs.readFileSync(sourceCodeFile.path);
    const sourcemapBuffer = fs.readFileSync(sourcemapFile.path);
    
    return this.integrationService.uploadSourceCodeAndSourcemap(
      sourceCodeBuffer,
      sourcemapBuffer,
      projectId,
      version,
      {
        buildId,
        branchName,
        commitMessage,
        uploadedBy,
        description,
        setAsActive: setAsActive
      }
    );
  }

  /**
   * 获取源代码和sourcemap的关联信息
   */
  @Get('association/:projectId')
  @ApiOperation({
    summary: '获取源代码和sourcemap的关联信息',
    description: '查询指定项目的源代码与sourcemap关联关系，可指定版本号'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取关联信息成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        sourceCodeVersion: { type: 'object' },
        sourcemapFiles: { type: 'array', items: { type: 'object' } },
        message: { type: 'string', example: '获取关联信息成功' }
      }
    }
  })
  async getAssociation(
    @Param('projectId') projectId: string,
    @Query('version') version?: string
  ) {
    return this.integrationService.getSourceCodeSourcemapAssociation(projectId, version);
  }

  /**
   * 根据错误信息定位源代码
   */
  @Get('locate-source-code')
  @ApiOperation({
    summary: '根据错误信息定位源代码',
    description: '根据错误文件名和行号定位对应的源代码内容'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '源代码定位成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        sourceCode: {
          type: 'object',
          properties: {
            content: { type: 'string', example: 'function example() {\n  return \"hello\";\n}' },
            lines: { type: 'array', items: { type: 'string' } },
            targetLine: { type: 'string', example: '  return \"hello\";' },
            startLine: { type: 'number', example: 1 },
            endLine: { type: 'number', example: 3 }
          }
        },
        sourcemapInfo: { type: 'object' },
        message: { type: 'string', example: '源代码定位成功' }
      }
    }
  })
  async locateSourceCodeByError(
    @Query('projectId') projectId: string,
    @Query('version') version: string,
    @Query('fileName') fileName: string,
    @Query('lineNumber') lineNumber: number,
    @Query('columnNumber') columnNumber?: number,
    @Query('errorMessage') errorMessage?: string
  ) {
    if (!projectId || !version || !fileName || !lineNumber) {
      throw new HttpException('缺少必要参数', HttpStatus.BAD_REQUEST);
    }

    return this.integrationService.locateSourceCodeByError(
      projectId,
      version,
      {
        fileName,
        lineNumber: parseInt(lineNumber.toString(), 10),
        columnNumber: columnNumber ? parseInt(columnNumber.toString(), 10) : undefined,
        errorMessage
      }
    );
  }

  /**
   * 为AI诊断准备源代码上下文
   */
  @Post('prepare-ai-context')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '为AI诊断准备源代码上下文',
    description: '准备错误相关的源代码上下文，用于AI诊断和分析'
  })
  @ApiBody({
    description: 'AI诊断上下文参数',
    schema: {
      type: 'object',
      required: ['projectId', 'version', 'errorFile', 'errorLine'],
      properties: {
        projectId: { type: 'string', example: 'test-project' },
        version: { type: 'string', example: '1.极速版0.0' },
        errorFile: { type: 'string', example: 'src/main.js' },
        errorLine: { type: 'number', example: 42 },
        errorColumn: { type: 'number', example: 15 },
        relatedFiles: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['src/utils.js', 'src/helper.js']
        },
        contextSize: { type: 'number', example: 5 }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AI诊断上下文准备成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        context: {
          type: 'object',
          properties: {
            errorFile: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                errorLocation: {
                  type: 'object',
                  properties: {
                    line: { type: 'number' },
                    column: { type: 'number' },
                    context: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            },
            relatedFiles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  fileName: { type: 'string' },
                  content: { type: 'string' }
                }
              }
            }
          }
        },
        message: { type: 'string', example: 'AI诊断上下文准备成功' }
      }
    }
  })
  async prepareAIContext(
    @Body() body: {
      projectId: string;
      version: string;
      errorFile: string;
      errorLine: number;
      errorColumn?: number;
      relatedFiles?: string[];
      contextSize?: number;
    }
  ) {
    if (!body.projectId || !body.version || !body.errorFile || !body.errorLine) {
      throw new HttpException('缺少必要参数', HttpStatus.BAD_REQUEST);
    }

    return this.integrationService.prepareSourceCodeContextForAIDiagnosis(
      body.projectId,
      body.version,
      {
        errorFile: body.errorFile,
        errorLine: body.errorLine,
        errorColumn: body.errorColumn,
        relatedFiles: body.relatedFiles,
        contextSize: body.contextSize
      }
    );
  }

  /**
   * 设置活跃关联
   */
  @Post('set-active/:projectId/:versionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '设置活跃关联',
    description: '将指定版本设置为项目的活跃关联版本'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '活跃版本设置成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '活跃版本设置成功' }
      }
    }
  })
  async setActiveAssociation(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string
  ) {
    console.log(`设置活跃关联请求: projectId=${projectId}, versionId=${versionId}`);
    const versionIdNum = parseInt(versionId, 10);
    if (isNaN(versionIdNum)) {
      throw new HttpException('版本ID必须是数字', HttpStatus.BAD_REQUEST);
    }
    
    return this.integrationService.setActiveAssociation(projectId, versionIdNum);
  }

  /**
   * 删除关联
   */
  @Delete('association/:projectId/:versionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除关联',
    description: '删除指定版本的源代码与sourcemap关联'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '关联删除成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '关联删除成功' }
      }
    }
  })
  async deleteAssociation(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string
  ) {
    console.log(`删除关联请求: projectId=${projectId}, versionId=${versionId}`);
    const versionIdNum = parseInt(versionId, 10);
    if (isNaN(versionIdNum)) {
      throw new HttpException('版本ID必须是数字', HttpStatus.BAD_REQUEST);
    }
    
    return this.integrationService.deleteAssociation(projectId, versionIdNum);
  }
}