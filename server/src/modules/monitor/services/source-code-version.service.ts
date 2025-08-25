import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as AdmZip from "adm-zip";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import { SourceCodeVersion } from "../entities/source-code-version.entity";
import { SourceCodeFile } from "../entities/source-code-file.entity";
import {
  UploadSourceCodeVersionDto,
  QuerySourceCodeVersionDto,
  QuerySourceCodeFileDto,
} from "../dto/upload-source-code-version.dto";

/**
 * 源代码版本管理服务
 */
@Injectable()
export class SourceCodeVersionService {
  private readonly storageBasePath = "./storage/source-code";

  constructor(
    @InjectRepository(SourceCodeVersion)
    private readonly versionRepository: Repository<SourceCodeVersion>,
    @InjectRepository(SourceCodeFile)
    private readonly fileRepository: Repository<SourceCodeFile>
  ) {
    // 确保存储目录存在
    this.ensureStorageDirectory();
  }

  /**
   * 上传源代码版本
   * 支持 multipart 文件流或兼容旧版 base64
   */
  async uploadSourceCodeVersion(
    dto: UploadSourceCodeVersionDto,
    fileBuffer?: Buffer
  ): Promise<{
    success: boolean;
    message: string;
    versionId?: number;
    fileCount?: number;
  }> {
    try {
      // 获取压缩包 Buffer（优先使用 multipart 文件流）
      const archiveBuffer =
        fileBuffer ??
        (dto.archiveContent
          ? Buffer.from(dto.archiveContent, "base64")
          : undefined);

      if (!archiveBuffer) {
        throw new HttpException("缺少上传文件", HttpStatus.BAD_REQUEST);
      }

      const zip = new AdmZip(archiveBuffer);
      const entries = zip.getEntries();

      // 读取 manifest.json（若存在）
      const manifestEntry = entries.find(
        (e) =>
          !e.isDirectory && e.entryName.toLowerCase().endsWith("manifest.json")
      );
      let manifest: any | undefined;
      if (manifestEntry) {
        try {
          manifest = JSON.parse(manifestEntry.getData().toString("utf-8"));
        } catch {
          throw new HttpException(
            "manifest.json 解析失败",
            HttpStatus.BAD_REQUEST
          );
        }
      }

      // 决定并校验 projectId / version
      let projectId = dto.projectId ?? manifest?.projectId;
      let version = dto.version ?? manifest?.version;

      if (!projectId) {
        throw new HttpException("缺少 projectId", HttpStatus.BAD_REQUEST);
      }
      if (!version) {
        // 若未提供，自动生成一个版本号
        version = `v${Date.now()}`;
      }

      if (manifest?.projectId && manifest.projectId !== projectId) {
        throw new HttpException(
          "Body 与 manifest 的 projectId 不一致",
          HttpStatus.BAD_REQUEST
        );
      }
      if (manifest?.version && manifest.version !== version) {
        throw new HttpException(
          "Body 与 manifest 的 version 不一致",
          HttpStatus.BAD_REQUEST
        );
      }

      // 检查是否存在相同版本，如果存在则删除所有旧版本
      const existingVersions = await this.versionRepository.find({
        where: { projectId, version },
      });

      if (existingVersions.length > 0) {
        console.log(
          `项目 ${projectId} 版本 ${version} 已存在 ${existingVersions.length} 个记录，将删除所有旧版本并上传新版本`
        );

        for (const existingVersion of existingVersions) {
          // 删除旧版本的文件记录
          await this.fileRepository.delete({ versionId: existingVersion.id });

          // 删除旧版本的存储文件
          try {
            if (
              existingVersion.storagePath &&
              fs.existsSync(existingVersion.storagePath)
            ) {
              fs.rmSync(existingVersion.storagePath, {
                recursive: true,
                force: true,
              });
            }
          } catch (error) {
            console.error("删除旧版本存储文件失败:", error);
          }

          // 删除旧版本记录
          await this.versionRepository.delete({ id: existingVersion.id });
        }
      }

      // 创建存储路径并落地原始 zip
      const storagePath = path.join(this.storageBasePath, projectId, version);
      fs.mkdirSync(storagePath, { recursive: true });
      const archiveName = dto.archiveName || `${projectId}-${version}.zip`;
      const archivePath = path.join(storagePath, archiveName);
      fs.writeFileSync(archivePath, archiveBuffer);

      // 创建版本记录
      const versionRow = new SourceCodeVersion();
      versionRow.projectId = projectId;
      versionRow.version = version;
      versionRow.buildId = dto.buildId ?? manifest?.buildId;
      versionRow.branchName =
        dto.branchName ?? manifest?.branchName ?? manifest?.branch;
      versionRow.commitMessage =
        dto.commitMessage ?? manifest?.commitMessage ?? manifest?.commit;
      versionRow.storagePath = storagePath;
      versionRow.archiveName = archiveName;
      versionRow.archiveSize = archiveBuffer.length;
      versionRow.uploadedBy = dto.uploadedBy;
      versionRow.description = dto.description;
      versionRow.isActive = dto.setAsActive || false;

      const savedVersion = await this.versionRepository.save(versionRow);

      // 文件入库策略
      const TEXT_EXT = [
        ".js",
        ".ts",
        ".jsx",
        ".tsx",
        ".vue",
        ".css",
        ".scss",
        ".less",
        ".html",
        ".json",
        ".xml",
        ".yaml",
        ".yml",
        ".md",
        ".txt",
        ".csv",
      ];
      const SIZE_LIMIT = 200 * 1024; // 200KB

      const extType = (name: string) => {
        const ext = path.extname(name).toLowerCase();
        const map: Record<string, string> = {
          ".js": "javascript",
          ".ts": "typescript",
          ".jsx": "javascript",
          ".tsx": "typescript",
          ".vue": "vue",
          ".css": "css",
          ".scss": "scss",
          ".less": "less",
          ".html": "html",
          ".json": "json",
          ".xml": "xml",
          ".yaml": "yaml",
          ".yml": "yaml",
          ".md": "markdown",
          ".txt": "text",
          ".csv": "text",
        };
        return map[ext] || (TEXT_EXT.includes(ext) ? "text" : "binary");
      };
      const isText = (name: string) =>
        TEXT_EXT.includes(path.extname(name).toLowerCase());

      const list: any[] = [];
      let processedCount = 0;

      for (const entry of entries) {
        if (entry.isDirectory) continue;
        // 跳过 manifest.json
        if (entry.entryName.toLowerCase().endsWith("manifest.json")) {
          continue;
        }

        try {
          const rel = entry.entryName;
          // 忽略部分目录/文件，避免将依赖与构建产物入库
          const lowerRel = rel.toLowerCase();
          const baseName = path.basename(rel).toLowerCase();
          const ignoreDirs = [
            "/node_modules/",
            "\\node_modules\\",
            "/.git/",
            "\\.git\\",
            "/dist/",
            "\\dist\\",
            "/build/",
            "\\build\\",
            "/coverage/",
            "\\coverage\\",
          ];
          if (
            ignoreDirs.some((p) => lowerRel.includes(p)) ||
            baseName === ".ds_store" ||
            baseName.endsWith(".log") ||
            baseName === "package-lock.json" ||
            baseName === "yarn.lock" ||
            baseName.startsWith(".env")
          ) {
            continue;
          }
          const buf = entry.getData();
          const size = entry.header.size;
          const type = extType(rel);
          const textLike = isText(rel);

          const fileHash = crypto.createHash("md5").update(buf).digest("hex");

          const sourceFile = new SourceCodeFile();
          sourceFile.versionId = savedVersion.id;
          sourceFile.projectId = projectId;
          sourceFile.filePath = rel;
          sourceFile.fileName = path.basename(rel);
          sourceFile.fileType = type;
          sourceFile.fileSize = size;
          sourceFile.fileHash = fileHash;
          sourceFile.isSourceFile = textLike;

          if (textLike && size <= SIZE_LIMIT) {
            const content = buf.toString("utf-8");
            sourceFile.sourceContent = content;
            sourceFile.lineCount = content.split("\n").length;
            sourceFile.charCount = content.length;
          }

          await this.fileRepository.save(sourceFile);
          processedCount++;
        } catch (error) {
          console.error(`处理文件 ${entry.entryName} 失败:`, error);
        }
      }

      return {
        success: true,
        message: `源代码版本上传成功，处理了 ${processedCount} 个文件`,
        versionId: savedVersion.id,
        fileCount: processedCount,
      };
    } catch (error) {
      console.error("上传源代码版本失败:", error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "上传源代码版本失败",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 查询源代码版本列表
   */
  async querySourceCodeVersions(dto: QuerySourceCodeVersionDto): Promise<{
    success: boolean;
    data: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { projectId, page = 1, pageSize = 10 } = dto;

    const queryBuilder = this.versionRepository.createQueryBuilder("version");

    if (projectId) {
      queryBuilder.where("version.projectId = :projectId", { projectId });
    }

    queryBuilder.orderBy("version.createdAt", "DESC");

    const total = await queryBuilder.getCount();
    const versions = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      success: true,
      data: versions,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 查询源代码文件列表
   */
  async querySourceCodeFiles(dto: QuerySourceCodeFileDto): Promise<{
    success: boolean;
    data: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { versionId, projectId, fileName, page = 1, pageSize = 50 } = dto;

    const queryBuilder = this.fileRepository.createQueryBuilder("file");

    if (versionId) {
      queryBuilder.where("file.versionId = :versionId", { versionId });
    }
    if (projectId) {
      queryBuilder.andWhere("file.projectId = :projectId", { projectId });
    }
    if (fileName) {
      queryBuilder.andWhere("file.fileName LIKE :fileName", {
        fileName: `%${fileName}%`,
      });
    }

    queryBuilder.orderBy("file.filePath", "ASC");

    const total = await queryBuilder.getCount();
    const files = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      success: true,
      data: files,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取源代码文件内容
   */
  async getSourceCodeFileContent(
    versionId: number,
    filePath: string
  ): Promise<{
    success: boolean;
    data?: {
      file: any;
      content: string;
    };
    message?: string;
  }> {
    const file = await this.fileRepository.findOne({
      where: { versionId, filePath },
    });

    if (!file) {
      return {
        success: false,
        message: "文件不存在",
      };
    }

    if (!file.isSourceFile) {
      return {
        success: false,
        message: "该文件不是源代码文件",
      };
    }

    let content = file.sourceContent || "";

    // 如果数据库中没有内容，尝试从压缩包中读取
    if (!content) {
      try {
        const version = await this.versionRepository.findOne({
          where: { id: versionId },
        });
        if (version) {
          const archivePath = path.join(
            version.storagePath,
            version.archiveName
          );
          if (fs.existsSync(archivePath)) {
            const zip = new AdmZip(archivePath);
            const entry = zip.getEntry(filePath);
            if (entry && !entry.isDirectory) {
              content = entry.getData().toString("utf-8");
            }
          }
        }
      } catch (error) {
        console.error("从压缩包读取文件内容失败:", error);
      }
    }

    return {
      success: true,
      data: {
        file: {
          id: file.id,
          versionId: file.versionId,
          projectId: file.projectId,
          filePath: file.filePath,
          fileName: file.fileName,
          fileType: file.fileType,
          fileSize: file.fileSize,
          lineCount: file.lineCount,
          charCount: file.charCount,
        },
        content,
      },
    };
  }

  /**
   * 根据文件路径和行号获取源代码内容
   */
  async getSourceCodeByLocation(
    projectId: string,
    version: string,
    filePath: string,
    lineNumber?: number,
    contextLines: number = 5
  ): Promise<{
    success: boolean;
    data?: {
      file: any;
      content: string;
      lines?: string[];
      targetLine?: string;
      startLine?: number;
      endLine?: number;
    };
    message?: string;
  }> {
    // 查找版本记录（默认返回最新上传的版本）
    const versionRecord = await this.findByProjectAndVersion(
      projectId,
      version
    );
    if (!versionRecord) {
      return {
        success: false,
        message: `未找到项目 ${projectId} 的版本 ${version}`,
      };
    }

    // 查找文件记录
    const file = await this.fileRepository.findOne({
      where: { versionId: versionRecord.id, filePath },
    });

    if (!file) {
      return {
        success: false,
        message: `未找到文件 ${filePath}`,
      };
    }

    if (!file.isSourceFile) {
      return {
        success: false,
        message: "该文件不是源代码文件",
      };
    }

    let content = file.sourceContent || "";

    // 如果数据库中没有内容，尝试从压缩包中读取
    if (!content) {
      try {
        const archivePath = path.join(
          versionRecord.storagePath,
          versionRecord.archiveName
        );
        if (fs.existsSync(archivePath)) {
          const zip = new AdmZip(archivePath);
          const entry = zip.getEntry(filePath);
          if (entry && !entry.isDirectory) {
            content = entry.getData().toString("utf-8");
          }
        }
      } catch (error) {
        console.error("从压缩包读取文件内容失败:", error);
      }
    }

    const result: any = {
      success: true,
      data: {
        file: {
          id: file.id,
          versionId: file.versionId,
          projectId: file.projectId,
          filePath: file.filePath,
          fileName: file.fileName,
          fileType: file.fileType,
          fileSize: file.fileSize,
          lineCount: file.lineCount,
          charCount: file.charCount,
        },
        content,
      },
    };

    // 如果指定了行号，返回上下文行
    if (lineNumber && content) {
      const lines = content.split("\n");
      const targetLineIndex = lineNumber - 1; // 转换为 0 基索引

      if (targetLineIndex >= 0 && targetLineIndex < lines.length) {
        const startLine = Math.max(0, targetLineIndex - contextLines);
        const endLine = Math.min(
          lines.length - 1,
          targetLineIndex + contextLines
        );

        result.data.lines = lines.slice(startLine, endLine + 1);
        result.data.targetLine = lines[targetLineIndex];
        result.data.startLine = startLine + 1; // 转换回 1 基索引
        result.data.endLine = endLine + 1;
      }
    }

    return result;
  }

  /**
   * 设置活跃版本
   */
  async setActiveVersion(projectId: string, versionId: number) {
    // 取消所有版本的活跃状态
    await this.versionRepository.update({ projectId }, { isActive: false });

    // 设置指定版本为活跃
    await this.versionRepository.update({ id: versionId }, { isActive: true });
  }

  /**
   * 根据项目和版本查找源代码版本
   * 默认返回最新上传的版本（按uploadTimestamp降序）
   */
  async findByProjectAndVersion(
    projectId: string,
    version: string
  ): Promise<SourceCodeVersion | null> {
    return this.versionRepository.findOne({
      where: { projectId, version },
    });
  }

  /**
   * 删除源代码版本
   */
  async deleteSourceCodeVersion(
    projectId: string,
    version: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const versionEntity = await this.findByProjectAndVersion(
      projectId,
      version
    );
    if (!versionEntity) {
      throw new HttpException(`版本 ${version} 不存在`, HttpStatus.NOT_FOUND);
    }

    // 删除文件记录
    await this.fileRepository.delete({ versionId: versionEntity.id });

    // 删除版本记录
    await this.versionRepository.delete({ id: versionEntity.id });

    // 删除存储文件
    try {
      fs.rmSync(versionEntity.storagePath, { recursive: true, force: true });
    } catch (error) {
      console.error("删除存储文件失败:", error);
    }

    return {
      success: true,
      message: `版本 ${version} 删除成功`,
    };
  }

  /**
   * 确保存储目录存在
   */
  private ensureStorageDirectory() {
    if (!fs.existsSync(this.storageBasePath)) {
      fs.mkdirSync(this.storageBasePath, { recursive: true });
    }
  }
}
