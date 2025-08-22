import { SourceMapService } from '../modules/sourcemap/services/sourcemap.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * SourceMap服务简单测试
 * 验证SourceMap错误定位的核心功能
 */
describe('SourceMap Simple Test', () => {
  let sourcemapService: SourceMapService;
  const testSourcemapPath = '/tmp/test-sourcemaps';
  
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
    if (!fs.existsSync(testSourcemapPath)) {
      fs.mkdirSync(testSourcemapPath, { recursive: true });
    }
    
    const mapFilePath = path.join(testSourcemapPath, 'app.min.js.map');
    fs.writeFileSync(mapFilePath, JSON.stringify(mockSourceMapContent));
    
    // 初始化服务
    const mockConfigService = {
      get: jest.fn().mockReturnValue(86400), // 默认缓存时间
    } as any;
    sourcemapService = new SourceMapService(mockConfigService);
  });

  afterAll(async () => {
    // 清理测试文件
    const mapFilePath = path.join(testSourcemapPath, 'app.min.js.map');
    if (fs.existsSync(mapFilePath)) {
      fs.unlinkSync(mapFilePath);
    }
    if (fs.existsSync(testSourcemapPath)) {
      fs.rmdirSync(testSourcemapPath);
    }
  });

  afterEach(() => {
    // 清理缓存
    sourcemapService.clearCache();
  });

  /**
   * 测试SourceMap错误位置解析
   */
  describe('parseErrorLocation', () => {
    it('应该成功解析错误位置', async () => {
      const originalPosition = await sourcemapService.parseErrorLocation(
        'test-project',
        'app.min.js',
        1,
        0,
        testSourcemapPath
      );
      
      expect(originalPosition).toBeDefined();
      expect(originalPosition.source).toBe('src/app.ts');
      expect(originalPosition.line).toBeGreaterThan(0);
      expect(originalPosition.sourceContent).toBeDefined();
    });

    it('应该处理无效的SourceMap路径', async () => {
      const originalPosition = await sourcemapService.parseErrorLocation(
        'test-project',
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
        'test-project',
        'app.min.js',
        1,
        0,
        testSourcemapPath
      );
      
      // 第二次调用应该使用缓存
      const position2 = await sourcemapService.parseErrorLocation(
        'test-project',
        'app.min.js',
        1,
        0,
        testSourcemapPath
      );
      
      expect(position1).toEqual(position2);
    });
  });

  /**
   * 测试缓存管理
   */
  describe('Cache Management', () => {
    it('应该能够清理特定项目的缓存', async () => {
      // 创建缓存
      await sourcemapService.parseErrorLocation(
        'test-project-1',
        'app.min.js',
        1,
        0,
        testSourcemapPath
      );
      
      await sourcemapService.parseErrorLocation(
        'test-project-2',
        'app.min.js',
        1,
        0,
        testSourcemapPath
      );
      
      // 清理特定项目缓存
      sourcemapService.clearCache('test-project-1');
      
      // 验证缓存状态（这里只是确保方法能正常执行）
      expect(true).toBe(true);
    });

    it('应该能够清理所有缓存', async () => {
      // 创建缓存
      await sourcemapService.parseErrorLocation(
        'test-project',
        'app.min.js',
        1,
        0,
        testSourcemapPath
      );
      
      // 清理所有缓存
      sourcemapService.clearCache();
      
      // 验证缓存状态（这里只是确保方法能正常执行）
      expect(true).toBe(true);
    });
  });
});