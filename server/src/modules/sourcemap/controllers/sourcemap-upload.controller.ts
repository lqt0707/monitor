import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { SourcemapUploadService } from '../services/sourcemap-upload.service';
import { UploadSourcemapDto, UploadSourcemapArchiveDto } from '../dto/upload-sourcemap.dto';

/**
 * Sourcemap上传控制器
 * 提供Sourcemap文件上传的RESTful API接口，支持单个文件和压缩包上传
 */
@ApiTags('Sourcemap上传')
@Controller('sourcemap-upload')
export class SourcemapUploadController {
  constructor(private readonly sourcemapUploadService: SourcemapUploadService) {}

  /**
   * 上传单个Sourcemap文件
   * @param uploadSourcemapDto Sourcemap上传数据
   * @returns 上传结果
   */
  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '上传单个Sourcemap文件',
    description: '上传单个Sourcemap文件进行处理和分析'
  })
  @ApiBody({
    type: UploadSourcemapDto,
    description: 'Sourcemap文件上传数据',
    examples: {
      example1: {
        summary: 'Sourcemap文件上传示例',
        value: {
          projectId: '1',
          sourcemap: 'base64 encoded sourcemap content',
          fileName: 'main.js.map',
          filePath: 'dist'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sourcemap文件上传成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Sourcemap文件上传成功' },
        fileName: { type: 'string', example: 'main.js.map' },
        filePath: { type: 'string', example: 'dist' },
        processed: { type: 'object' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '请求参数错误或无效的Sourcemap文件'
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: '服务器内部错误'
  })
  async uploadSourcemap(@Body() uploadSourcemapDto: UploadSourcemapDto) {
    return this.sourcemapUploadService.uploadSourcemap(uploadSourcemapDto);
  }

  /**
   * 上传Sourcemap压缩包
   * @param uploadSourcemapArchiveDto 压缩包上传数据
   * @returns 解压和处理结果
   */
  @Post('upload-archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '上传Sourcemap压缩包',
    description: '上传包含多个Sourcemap文件的压缩包，支持zip、tar、gz等格式'
  })
  @ApiBody({
    type: UploadSourcemapArchiveDto,
    description: 'Sourcemap压缩包上传数据',
    examples: {
      example1: {
        summary: '压缩包上传示例',
        value: {
          projectId: '1',
          archive: 'base64 encoded archive content',
          fileName: 'sourcemaps.zip',
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
              fileName: { type: 'string', example: 'main.js.map' },
              success: { type: 'boolean', example: true },
              result: { type: 'object' }
            }
          }
        },
        archiveName: { type: 'string', example: 'sourcemaps.zip' }
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
  async uploadSourcemapArchive(@Body() uploadSourcemapArchiveDto: UploadSourcemapArchiveDto) {
    return this.sourcemapUploadService.uploadSourcemapArchive(uploadSourcemapArchiveDto);
  }

  /**
   * 批量上传Sourcemap文件
   * @param uploadSourcemapDtos 多个Sourcemap上传数据
   * @returns 批量处理结果
   */
  @Post('batch-upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '批量上传Sourcemap文件',
    description: '批量上传多个Sourcemap文件进行处理'
  })
  @ApiBody({
    type: [UploadSourcemapDto],
    description: '多个Sourcemap文件上传数据'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '批量Sourcemap文件上传成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '批量Sourcemap文件上传成功' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fileName: { type: 'string', example: 'main.js.map' },
              success: { type: 'boolean', example: true },
              result: { type: 'object' }
            }
          }
        }
      }
    }
  })
  async batchUploadSourcemap(@Body() uploadSourcemapDtos: UploadSourcemapDto[]) {
    const results = [];
    
    for (const dto of uploadSourcemapDtos) {
      try {
        const result = await this.sourcemapUploadService.uploadSourcemap(dto);
        results.push({
          fileName: dto.fileName,
          success: true,
          result
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
}