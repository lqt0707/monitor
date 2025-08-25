import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ProjectConfigService } from '../modules/project-config/project-config.service';
import { SourceMapService } from '../modules/sourcemap/services/sourcemap.service';
import { SourcemapProcessingProcessor } from '../modules/sourcemap/processors/sourcemap-processing.processor';
import { ErrorHashService } from '../modules/monitor/services/error-hash.service';
import { QueueService } from '../modules/monitor/services/queue.service';
import { ProjectConfig } from '../modules/project-config/entities/project-config.entity';
import { ErrorLog } from '../modules/monitor/entities/error-log.entity';
import { ErrorAggregation } from '../modules/monitor/entities/error-aggregation.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * SourceMap错误定位功能集成测试
 * 测试从项目配置到错误源码定位的完整流程
 */
describe('SourceMap Integration Test', () => {
  let module: TestingModule;
  let projectConfigService: ProjectConfigService;
  let sourcemapService: SourceMapService;
  let sourcemapProcessor: SourcemapProcessingProcessor;
  let projectConfigRepository: Repository<ProjectConfig>;
  let errorLogRepository: Repository<ErrorLog>;
  let errorAggregationRepository: Repository<ErrorAggregation>;

  // 测试数据
  const testProjectConfig = {
    projectId: 'test-project-123',
    name: 'test-project',
    apiKey: 'test-api-key-123',
    enableSourcemap: true,
    sourcemapPath: '/tmp/test-sourcemaps',
    enableErrorAggregation: true,
    enabled: true,
  };

  const testErrorLog = {
    projectId: 'test-project-123',
    type: 'TypeError',
    errorHash: 'test-hash-123',
    errorMessage: 'Cannot read property of undefined',
    sourceFile: 'app.min.js',
    sourceLine: 1,
    sourceColumn: 1234,
    errorStack: 'TypeError: Cannot read property of undefined\n    at app.min.js:1:1234',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    pageUrl: 'https://example.com/app',
    errorLevel: 1,
    isProcessed: false,
  };

  // 模拟SourceMap文件内容
  const mockSourceMapContent = {
    version: 3,
    sources: ['src/app.ts'],
    names: ['console', 'log', 'message'],
    mappings: 'AAAA,QAAQ,CAAC,GAAG,CAAC,SAAS,CAAC',
    sourcesContent: ['console.log("Hello World");'],
  };

  beforeAll(async () => {
    // 创建测试用的SourceMap目录和文件
    if (!fs.existsSync(testProjectConfig.sourcemapPath)) {
      fs.mkdirSync(testProjectConfig.sourcemapPath, { recursive: true });
    }
    
    const mapFilePath = path.join(testProjectConfig.sourcemapPath, 'app.min.js.map');
    fs.writeFileSync(mapFilePath, JSON.stringify(mockSourceMapContent));
  });

  afterAll(async () => {
    // 清理测试文件
    const mapFilePath = path.join(testProjectConfig.sourcemapPath, 'app.min.js.map');
    if (fs.existsSync(mapFilePath)) {
      fs.unlinkSync(mapFilePath);
    }
    if (fs.existsSync(testProjectConfig.sourcemapPath)) {
      fs.rmdirSync(testProjectConfig.sourcemapPath);
    }
    
    if (module) {
      await module.close();
    }
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [ProjectConfig, ErrorLog, ErrorAggregation],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([ProjectConfig, ErrorLog, ErrorAggregation]),
      ],
      providers: [
        ProjectConfigService,
        SourceMapService,
        {
          provide: QueueService,
          useValue: {
            addSourcemapProcessingJob: jest.fn(),
          },
        },
        {
          provide: SourcemapProcessingProcessor,
          useFactory: (projectConfigService, errorLogRepo, errorAggRepo, queueService, sourcemapService, projectConfigRepo) => {
            return new SourcemapProcessingProcessor(projectConfigService, errorLogRepo, errorAggRepo, queueService, sourcemapService, projectConfigRepo);
          },
          inject: [ProjectConfigService, getRepositoryToken(ErrorLog), getRepositoryToken(ErrorAggregation), QueueService, SourceMapService, getRepositoryToken(ProjectConfig)],
        },
      ],
    }).compile();

    projectConfigService = module.get<ProjectConfigService>(ProjectConfigService);
    sourcemapService = module.get<SourceMapService>(SourceMapService);
    sourcemapProcessor = module.get<SourcemapProcessingProcessor>(SourcemapProcessingProcessor);
    projectConfigRepository = module.get<Repository<ProjectConfig>>(getRepositoryToken(ProjectConfig));
    errorLogRepository = module.get<Repository<ErrorLog>>(getRepositoryToken(ErrorLog));
    errorAggregationRepository = module.get<Repository<ErrorAggregation>>(getRepositoryToken(ErrorAggregation));
  });

  afterEach(async () => {
    // 清理数据库
    await errorLogRepository.clear();
    await errorAggregationRepository.clear();
    await projectConfigRepository.clear();
    
    // 清理SourceMap缓存
    sourcemapService.clearCache();
  });

  /**
   * 测试项目配置创建和SourceMap配置
   */
  describe('Project Configuration', () => {
    it('应该成功创建项目配置', async () => {
      const projectConfig = await projectConfigService.create(testProjectConfig);
      
      expect(projectConfig).toBeDefined();
      expect(projectConfig.name).toBe(testProjectConfig.name);
      expect(projectConfig.enableSourcemap).toBe(true);
      expect(projectConfig.sourcemapPath).toBe(testProjectConfig.sourcemapPath);
    });

    it('应该成功获取SourceMap配置', async () => {
      const projectConfig = await projectConfigService.create(testProjectConfig);
      const sourcemapConfig = await projectConfigService.getSourcemapConfig(projectConfig.projectId);
      
      expect(sourcemapConfig.enableSourcemap).toBe(true);
      expect(sourcemapConfig.sourcemapPath).toBe(testProjectConfig.sourcemapPath);
    });

    it('应该成功更新SourceMap配置', async () => {
      const projectConfig = await projectConfigService.create(testProjectConfig);
      const updatedConfig = await projectConfigService.updateSourcemapConfig(
        projectConfig.projectId,
        false,
        '/new/path'
      );
      
      expect(updatedConfig.enableSourcemap).toBe(false);
      expect(updatedConfig.sourcemapPath).toBe('/new/path');
    });
  });

  /**
   * 测试SourceMap服务功能
   */
  describe('SourceMap Service', () => {
    it('应该成功解析错误位置', async () => {
      const originalPosition = await sourcemapService.parseErrorLocation(
        '1',
        'app.min.js',
        1,
        0,
        testProjectConfig.sourcemapPath
      );
      
      expect(originalPosition).toBeDefined();
      expect(originalPosition.source).toBe('src/app.ts');
      expect(originalPosition.line).toBeGreaterThan(0);
    });

    it('应该处理无效的SourceMap路径', async () => {
      const originalPosition = await sourcemapService.parseErrorLocation(
        '1',
        'nonexistent.js',
        1,
        0,
        '/invalid/path'
      );
      
      expect(originalPosition).toBeNull();
    });

    it('应该正确缓存SourceMap消费者', async () => {
      // 第一次调用
      const position1 = await sourcemapService.parseErrorLocation(
        '1',
        'app.min.js',
        1,
        0,
        testProjectConfig.sourcemapPath
      );
      
      // 第二次调用应该使用缓存
      const position2 = await sourcemapService.parseErrorLocation(
        '1',
        'app.min.js',
        1,
        0,
        testProjectConfig.sourcemapPath
      );
      
      expect(position1).toEqual(position2);
    });
  });

  /**
   * 测试SourceMap处理器功能
   */
  describe('SourceMap Processor', () => {
    it('应该成功处理错误源码定位', async () => {
      // 创建项目配置
      const projectConfig = await projectConfigService.create(testProjectConfig);
      
      // 创建错误日志
      const errorLog = await errorLogRepository.save({
        ...testErrorLog,
        projectId: projectConfig.projectId,
      });
      
      // 模拟处理任务
      const job = {
        data: {
          errorLogId: errorLog.id.toString(),
          projectId: projectConfig.id.toString(),
        },
      } as any;
      
      // 执行处理
      await sourcemapProcessor.processSourcemap(job);
      
      // 验证错误日志已更新
      const updatedErrorLog = await errorLogRepository.findOne({
        where: { id: errorLog.id },
      });
      
      expect(updatedErrorLog.sourceFile).toBe('src/app.ts');
      expect(updatedErrorLog.sourceLine).toBeGreaterThan(0);
    });

    it('应该跳过禁用SourceMap的项目', async () => {
      // 创建禁用SourceMap的项目配置
      const projectConfig = await projectConfigService.create({
        ...testProjectConfig,
        enableSourcemap: false,
      });
      
      // 创建错误日志
      const errorLog = await errorLogRepository.save({
        ...testErrorLog,
        projectId: projectConfig.projectId,
      });
      
      // 模拟处理任务
      const job = {
        data: {
          errorLogId: errorLog.id.toString(),
          projectId: projectConfig.id.toString(),
        },
      } as any;
      
      // 执行处理
      await sourcemapProcessor.processSourcemap(job);
      
      // 验证错误日志未更新
      const updatedErrorLog = await errorLogRepository.findOne({
        where: { id: errorLog.id },
      });
      
      expect(updatedErrorLog.sourceFile).toBe(testErrorLog.sourceFile);
      expect(updatedErrorLog.sourceLine).toBe(testErrorLog.sourceLine);
    });
  });

  /**
   * 测试完整的错误定位流程
   */
  describe('End-to-End SourceMap Flow', () => {
    it('应该完成从错误捕获到源码定位的完整流程', async () => {
      // 1. 创建项目配置
      const projectConfig = await projectConfigService.create(testProjectConfig);
      
      // 2. 创建错误日志（模拟错误捕获）
      const errorLog = await errorLogRepository.save({
        ...testErrorLog,
        projectId: projectConfig.projectId,
      });
      
      // 3. 验证SourceMap配置
      const sourcemapConfig = await projectConfigService.getSourcemapConfig(projectConfig.projectId);
      expect(sourcemapConfig.enableSourcemap).toBe(true);
      expect(sourcemapConfig.sourcemapPath).toBe(testProjectConfig.sourcemapPath);
      
      // 4. 执行源码定位
      const originalPosition = await sourcemapService.parseErrorLocation(
        projectConfig.projectId,
        errorLog.sourceFile,
        errorLog.sourceLine,
        errorLog.sourceColumn,
        sourcemapConfig.sourcemapPath
      );
      
      // 5. 验证定位结果
      expect(originalPosition).toBeDefined();
      expect(originalPosition.source).toBe('src/app.ts');
      expect(originalPosition.line).toBeGreaterThan(0);
      expect(originalPosition.sourceContent).toBeDefined();
      
      // 6. 模拟处理器更新错误日志
      await errorLogRepository.update(errorLog.id, {
        sourceFile: originalPosition.source,
        sourceLine: originalPosition.line,
        sourceColumn: originalPosition.column,
      });
      
      // 7. 验证最终结果
      const finalErrorLog = await errorLogRepository.findOne({
        where: { id: errorLog.id },
      });
      
      expect(finalErrorLog.sourceFile).toBe('src/app.ts');
      expect(finalErrorLog.sourceLine).toBeGreaterThan(0);
    });
  });
});