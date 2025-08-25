import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { SourceCodeService } from '../services/source-code.service';
import { UploadSourceCodeDto, UploadSourceCodeArchiveDto } from '../dto/upload-source-code.dto';

/**
 * 源代码分析控制器
 * 提供源代码上传和分析的RESTful API接口
 */
@ApiTags('源代码分析')
@Controller('source-code')
export class SourceCodeController {
  constructor(private readonly sourceCodeService: SourceCodeService) {}

  /**
   * 上传源代码文件进行分析
   * @param uploadSourceCodeDto 源代码上传数据
   * @returns 分析结果和告警信息
   */
  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '上传源代码文件',
    description: '上传源代码文件进行安全分析、复杂度分析和告警规则检查'
  })
  @ApiBody({
    type: UploadSourceCodeDto,
    description: '源代码文件上传数据',
    examples: {
      example1: {
        summary: 'JavaScript文件上传示例',
        value: {
          projectId: 1,
          sourceCode: 'Y29uc29sZS5sb2coJ2hlbGxvIHdvcmxkJyk7', // base64 encoded: console.log('hello world');
          fileName: 'main.js',
          filePath: 'src',
          fileType: 'javascript'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '源代码上传和分析成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '源代码上传和分析成功' },
        analysisResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ruleId: { type: 'number', example: 1 },
              ruleName: { type: 'string', example: '安全漏洞检测' },
              analysisType: { type: 'string', example: 'security' },
              triggered: { type: 'boolean', example: true },
              message: { type: 'string', example: '告警规则"安全漏洞检测"被触发' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '请求参数错误'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '项目不存在'
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '服务器内部错误'
  })
  async uploadSourceCode(@Body() uploadSourceCodeDto: UploadSourceCodeDto) {
    return this.sourceCodeService.uploadSourceCode(uploadSourceCodeDto);
  }

  /**
   * 批量上传源代码文件
   * @param uploadSourceCodeDtos 多个源代码上传数据
   * @returns 批量分析结果
   */
  @Post('batch-upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '批量上传源代码文件',
    description: '批量上传多个源代码文件进行分析'
  })
  @ApiBody({
    type: [UploadSourceCodeDto],
    description: '多个源代码文件上传数据'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '批量源代码上传和分析成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '批量源代码上传和分析成功' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fileName: { type: 'string', example: 'main.js' },
              success: { type: 'boolean', example: true },
              analysisResults: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    ruleId: { type: 'number', example: 1 },
                    ruleName: { type: 'string', example: '安全漏洞检测' },
                    analysisType: { type: 'string', example: 'security' },
                    triggered: { type: 'boolean', example: true },
                    message: { type: 'string', example: '告警规则"安全漏洞检测"被触发' }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  async batchUploadSourceCode(@Body() uploadSourceCodeDtos: UploadSourceCodeDto[]) {
    const results = [];
    
    for (const dto of uploadSourceCodeDtos) {
      try {
        const result = await this.sourceCodeService.uploadSourceCode(dto);
        results.push({
          fileName: dto.fileName,
          success: true,
          analysisResults: result.analysisResults
        });
      } catch (error) {
        results.push({
          fileName: dto.fileName,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: results.every(r => r.success),
      message: results.every(r => r.success) ? '所有文件上传成功' : '部分文件上传失败',
      results
    };
  }

  /**
   * 上传源代码压缩包
   * @param uploadSourceCodeArchiveDto 源代码压缩包上传数据
   * @returns 解压和分析结果
   */
  @Post('upload-archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '上传源代码压缩包',
    description: '上传包含多个源代码文件的压缩包，支持zip、tar、gz等格式'
  })
  @ApiBody({
    type: UploadSourceCodeArchiveDto,
    description: '源代码压缩包上传数据',
    examples: {
      example1: {
        summary: '压缩包上传示例',
        value: {
          projectId: '1',
          archive: 'base64 encoded archive content',
          fileName: 'source-code.zip',
          archiveType: 'zip'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '压缩包上传和处理成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '压缩包处理完成，成功: 5, 失败: 0' },
        totalFiles: { type: 'number', example: 5 },
        processedFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fileName: { type: 'string', example: 'main.js' },
              success: { type: 'boolean', example: true },
              analysisResults: { type: 'array' }
            }
          }
        },
        archiveName: { type: 'string', example: 'source-code.zip' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '请求参数错误或压缩包格式不支持'
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '服务器内部错误'
  })
  async uploadSourceCodeArchive(@Body() uploadSourceCodeArchiveDto: UploadSourceCodeArchiveDto) {
    return this.sourceCodeService.uploadSourceCodeArchive(uploadSourceCodeArchiveDto);
  }
}