import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UploadSourcemapDto {
  /**
   * 项目ID
   */
  @ApiProperty({ description: '项目ID', example: '1' })
  @IsNotEmpty()
  @IsString()
  projectId: string;

  /**
   * Sourcemap文件内容（base64编码）
   */
  @ApiProperty({ description: 'Sourcemap文件内容（base64编码）', example: 'base64 encoded content' })
  @IsNotEmpty()
  @IsString()
  sourcemap: string;

  /**
   * 文件名
   */
  @ApiProperty({ description: '文件名', example: 'main.js.map' })
  @IsNotEmpty()
  @IsString()
  fileName: string;

  /**
   * 文件路径（可选）
   */
  @ApiProperty({ description: '文件路径（可选）', example: 'dist', required: false })
  @IsOptional()
  @IsString()
  filePath?: string;
}

export class UploadSourcemapArchiveDto {
  /**
   * 项目ID
   */
  @ApiProperty({ description: '项目ID', example: '1' })
  @IsNotEmpty()
  @IsString()
  projectId: string;

  /**
   * 压缩包文件内容（base64编码）
   */
  @ApiProperty({ description: '压缩包文件内容（base64编码）', example: 'base64 encoded archive content' })
  @IsNotEmpty()
  @IsString()
  archive: string;

  /**
   * 压缩包文件名
   */
  @ApiProperty({ description: '压缩包文件名', example: 'sourcemaps.zip' })
  @IsNotEmpty()
  @IsString()
  fileName: string;

  /**
   * 压缩包格式
   */
  @ApiProperty({ 
    description: '压缩包格式', 
    example: 'zip',
    enum: ['zip', 'tar', 'gz', 'rar', '7z']
  })
  @IsNotEmpty()
  @IsString()
  archiveType: string;
}