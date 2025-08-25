import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadSourcemapDto, UploadSourcemapArchiveDto } from '../dto/upload-sourcemap.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as decompress from 'decompress';
import { ProjectConfigService } from '../../project-config/project-config.service';

@Injectable()
export class SourcemapUploadService {
  constructor(
    private readonly projectConfigService: ProjectConfigService,
    private readonly configService: ConfigService
  ) {}
  /**
   * 上传单个Sourcemap文件
   * @param uploadSourcemapDto Sourcemap上传数据
   * @returns 上传结果
   */
  async uploadSourcemap(uploadSourcemapDto: UploadSourcemapDto): Promise<any> {
    try {
      // 解码base64内容
      const buffer = Buffer.from(uploadSourcemapDto.sourcemap, 'base64');
      
      // 验证是否为有效的Sourcemap文件
      if (!this.isValidSourcemap(buffer)) {
        throw new BadRequestException('无效的Sourcemap文件格式');
      }

      // 处理Sourcemap文件（这里可以添加具体的处理逻辑）
      const result = await this.processSourcemapFile(buffer, uploadSourcemapDto);
      
      return {
        success: true,
        message: 'Sourcemap文件上传成功',
        fileName: uploadSourcemapDto.fileName,
        filePath: uploadSourcemapDto.filePath,
        processed: result
      };
    } catch (error) {
      throw new InternalServerErrorException(`Sourcemap文件处理失败: ${error.message}`);
    }
  }

  /**
   * 上传Sourcemap压缩包
   * @param uploadSourcemapArchiveDto 压缩包上传数据
   * @returns 解压和处理结果
   */
  async uploadSourcemapArchive(uploadSourcemapArchiveDto: UploadSourcemapArchiveDto): Promise<any> {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sourcemap-'));
    
    try {
      // 解码base64压缩包内容
      const archiveBuffer = Buffer.from(uploadSourcemapArchiveDto.archive, 'base64');
      
      // 解压压缩包
      const files = await decompress(archiveBuffer, tempDir, {
        strip: 1 // 去除一级目录
      });

      if (files.length === 0) {
        throw new BadRequestException('压缩包为空或格式不支持');
      }

      // 处理解压后的文件
      const processedFiles = [];
      let successCount = 0;
      let errorCount = 0;

      for (const file of files) {
        if (file.type === 'file' && file.path.endsWith('.map')) {
          try {
            const result = await this.processSourcemapFile(
              file.data,
              {
                projectId: uploadSourcemapArchiveDto.projectId,
                sourcemap: file.data.toString('base64'),
                fileName: path.basename(file.path),
                filePath: path.dirname(file.path)
              }
            );
            
            processedFiles.push({
              fileName: file.path,
              success: true,
              result
            });
            successCount++;
          } catch (error) {
            processedFiles.push({
              fileName: file.path,
              success: false,
              error: error.message
            });
            errorCount++;
          }
        }
      }

      // 清理临时目录
      this.cleanupTempDir(tempDir);

      return {
        success: true,
        message: `压缩包处理完成，成功: ${successCount}, 失败: ${errorCount}`,
        totalFiles: files.length,
        processedFiles,
        archiveName: uploadSourcemapArchiveDto.fileName
      };

    } catch (error) {
      // 确保清理临时目录
      this.cleanupTempDir(tempDir);
      throw new InternalServerErrorException(`压缩包处理失败: ${error.message}`);
    }
  }

  /**
   * 验证是否为有效的Sourcemap文件
   * @param buffer 文件缓冲区
   * @returns 是否为有效的Sourcemap文件
   */
  private isValidSourcemap(buffer: Buffer): boolean {
    try {
      const content = buffer.toString('utf8');
      const json = JSON.parse(content);
      
      // 基本的Sourcemap验证
      return json && 
             typeof json === 'object' &&
             json.version !== undefined &&
             json.sources !== undefined &&
             Array.isArray(json.sources);
    } catch {
      return false;
    }
  }

  /**
   * 处理单个Sourcemap文件
   * @param buffer 文件缓冲区
   * @param metadata 文件元数据
   * @returns 处理结果
   */
  private async processSourcemapFile(buffer: Buffer, metadata: any): Promise<any> {
    try {
      // 获取项目配置
      const projectConfig = await this.projectConfigService.findByProjectId(metadata.projectId);
      
      // 获取存储路径，如果没有配置则使用默认路径
      let storagePath = projectConfig.sourcemapPath || 
                         this.configService.get<string>('SOURCEMAP_STORAGE_PATH', '/data/sourcemaps');
      
      // 如果存储路径是相对路径，转换为绝对路径（相对于服务器根目录）
      if (storagePath.startsWith('./') || storagePath.startsWith('../')) {
        storagePath = path.resolve(process.cwd(), storagePath);
      }
      
      // 创建项目专属目录
      const projectDir = path.join(storagePath, metadata.projectId);
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }
      
      // 生成唯一的文件名
      const timestamp = new Date().getTime();
      const fileName = `${metadata.fileName.replace('.map', '')}_${timestamp}.map`;
      const filePath = path.join(projectDir, fileName);
      
      // 保存文件到持久化存储
      fs.writeFileSync(filePath, buffer);
      
      // 返回处理结果
      return {
        processedAt: new Date().toISOString(),
        fileSize: buffer.length,
        storagePath: filePath,
        fileName: fileName,
        projectId: metadata.projectId,
        metadata
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException(`项目ID ${metadata.projectId} 不存在，请先创建项目配置`);
      }
      throw new InternalServerErrorException(`Sourcemap文件存储失败: ${error.message}`);
    }
  }

  /**
   * 清理临时目录
   * @param dirPath 目录路径
   */
  private cleanupTempDir(dirPath: string): void {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn(`清理临时目录失败: ${error.message}`);
    }
  }
}