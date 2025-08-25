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
  UploadedFile,
  HttpException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiConsumes,
} from "@nestjs/swagger";
import { SourceCodeVersionService } from "../services/source-code-version.service";
import {
  UploadSourceCodeVersionDto,
  QuerySourceCodeVersionDto,
  QuerySourceCodeFileDto,
} from "../dto/upload-source-code-version.dto";

/**
 * 源代码版本管理控制器
 */
@ApiTags("源代码版本管理")
@Controller("source-code-version")
export class SourceCodeVersionController {
  constructor(
    private readonly sourceCodeVersionService: SourceCodeVersionService
  ) {}

  /**
   * 上传源代码版本
   */
  @Post("upload")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "上传源代码版本",
    description: "上传项目源代码压缩包，创建新的版本记录",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "源代码版本上传成功",
  })
  async uploadSourceCodeVersion(
    @UploadedFile() file: any,
    @Body("projectId") projectId: string,
    @Body("version") version?: string,
    @Body("buildId") buildId?: string,
    @Body("branchName") branchName?: string,
    @Body("commitMessage") commitMessage?: string,
    @Body("uploadedBy") uploadedBy?: string,
    @Body("description") description?: string,
    @Body("setAsActive") setAsActive?: string
  ) {
    if (!file) {
      throw new HttpException("文件不能为空", HttpStatus.BAD_REQUEST);
    }

    const dto: UploadSourceCodeVersionDto = {
      projectId,
      version, // 允许为空，由服务端依据 manifest 兜底
      buildId,
      branchName,
      commitMessage,
      archiveName: file.originalname,
      uploadedBy,
      description,
      setAsActive: setAsActive === "true",
    };

    return this.sourceCodeVersionService.uploadSourceCodeVersion(
      dto,
      file.buffer
    );
  }

  /**
   * 获取源代码版本列表
   */
  @Get("versions")
  @ApiOperation({
    summary: "获取源代码版本列表",
    description: "查询项目的源代码版本列表",
  })
  async getSourceCodeVersions(@Query() dto: QuerySourceCodeVersionDto) {
    return this.sourceCodeVersionService.querySourceCodeVersions(dto);
  }

  /**
   * 获取版本的文件列表
   */
  @Get("files")
  @ApiOperation({
    summary: "获取版本的文件列表",
    description: "查询指定版本的源代码文件列表",
  })
  async getSourceCodeFiles(@Query() dto: QuerySourceCodeFileDto) {
    return this.sourceCodeVersionService.querySourceCodeFiles(dto);
  }

  /**
   * 获取源代码文件内容
   */
  @Get("file-content/:projectId/:version")
  @ApiOperation({
    summary: "获取源代码文件内容",
    description: "获取指定文件的源代码内容",
  })
  @ApiParam({ name: "projectId", description: "项目ID" })
  @ApiParam({ name: "version", description: "版本号" })
  async getSourceCodeFileContent(
    @Param("projectId") projectId: string,
    @Param("version") version: string,
    @Query("filePath") filePath: string
  ) {
    return this.sourceCodeVersionService.getSourceCodeByLocation(
      projectId,
      version,
      filePath
    );
  }

  /**
   * 设置活跃版本
   */
  @Post("set-active/:projectId/:versionId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "设置活跃版本",
    description: "将指定版本设置为项目的活跃版本",
  })
  @ApiParam({ name: "projectId", description: "项目ID" })
  @ApiParam({ name: "versionId", description: "版本ID" })
  async setActiveVersion(
    @Param("projectId") projectId: string,
    @Param("versionId") versionId: number
  ) {
    await this.sourceCodeVersionService.setActiveVersion(projectId, versionId);
    return { success: true, message: "活跃版本设置成功" };
  }

  /**
   * 删除源代码版本
   */
  @Delete(":projectId/:version")
  @ApiOperation({
    summary: "删除源代码版本",
    description: "删除指定的源代码版本及其相关文件",
  })
  @ApiParam({ name: "projectId", description: "项目ID" })
  @ApiParam({ name: "version", description: "版本号" })
  async deleteSourceCodeVersion(
    @Param("projectId") projectId: string,
    @Param("version") version: string
  ) {
    return this.sourceCodeVersionService.deleteSourceCodeVersion(
      projectId,
      version
    );
  }
}
