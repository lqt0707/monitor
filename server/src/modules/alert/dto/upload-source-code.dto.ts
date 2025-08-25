import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class UploadSourceCodeDto {
  /**
   * 项目ID
   */
  @ApiProperty({ description: '项目ID', example: '1' })
  @IsNotEmpty()
  @IsString()
  projectId: string;

  /**
   * 源代码文件内容（base64编码）
   */
  @ApiProperty({ description: '源代码文件内容（base64编码）', example: 'base64 encoded content' })
  @IsNotEmpty()
  @IsString()
  sourceCode: string;

  /**
   * 文件名
   */
  @ApiProperty({ description: '文件名', example: 'main.js' })
  @IsNotEmpty()
  @IsString()
  fileName: string;

  /**
   * 文件路径（可选）
   */
  @ApiProperty({ description: '文件路径（可选）', example: 'src/utils', required: false })
  @IsOptional()
  @IsString()
  filePath?: string;

  /**
   * 文件类型（可选）
   */
  @ApiProperty({ description: '文件类型（可选）', example: 'javascript', required: false })
  @IsOptional()
  @IsString()
  fileType?: string;
}

export class UploadSourceCodeArchiveDto {
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
  @ApiProperty({ description: '压缩包文件名', example: 'source-code.zip' })
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