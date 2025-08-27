import { Controller, Get, Post, Body, HttpException, HttpStatus, Sse, MessageEvent } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { DeepSeekService } from './deepseek.service';

@Controller('deepseek')
export class DeepSeekController {
  constructor(private readonly deepSeekService: DeepSeekService) {}

  /**
   * 获取DeepSeek服务状态
   */
  @Get('status')
  @ApiOperation({
    summary: '获取DeepSeek服务状态',
    description: '检查DeepSeek AI服务是否可用',
  })
  @ApiResponse({
    status: 200,
    description: '服务状态查询成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            available: { type: 'boolean', example: true },
            service: { type: 'string', example: 'DeepSeek AI' }
          }
        }
      }
    }
  })
  async getStatus() {
    const isAvailable = this.deepSeekService.isAvailable();
    return {
      success: true,
      data: {
        available: isAvailable,
        service: 'DeepSeek AI'
      }
    };
  }

  /**
   * 流式分析JavaScript错误
   */
  @Post('analyze-error-stream')
  @ApiOperation({
    summary: '流式分析JavaScript错误',
    description: '使用DeepSeek AI流式分析JavaScript错误堆栈并提供修复建议',
  })
  @ApiResponse({
    status: 200,
    description: '流式错误分析成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            analysis: { type: 'string', example: '详细的分析结果' },
            suggestions: { type: 'array', items: { type: 'string' }, example: ['修复建议1', '修复建议2'] },
            sourceLocation: {
              type: 'object',
              properties: {
                file: { type: 'string', example: 'src/components/Button.jsx' },
                line: { type: 'number', example: 42 },
                column: { type: 'number', example: 15 }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '错误堆栈不能为空' },
      }
    }
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['errorStack'],
      properties: {
        errorStack: {
          type: 'string',
          description: 'JavaScript错误堆栈',
          example: 'TypeError: Cannot read properties of undefined (reading \'map\')'
        },
        sourceContext: {
          type: 'string',
          description: '源代码上下文（可选）',
          example: 'function handleClick() {\n  const items = undefined;\n  return items.map(item => <div>{item}</div>);\n}'
        },
        projectId: {
          type: 'string',
          description: '项目ID（可选）',
          example: 'project-123'
        }
      }
    }
  })
  @Sse()
  async analyzeErrorStream(
    @Body() body: { errorStack: string; sourceContext?: string; projectId?: string }
  ): Promise<Observable<MessageEvent>> {
    const { errorStack, sourceContext, projectId } = body;

    if (!errorStack) {
      throw new HttpException('错误堆栈不能为空', HttpStatus.BAD_REQUEST);
    }

    return new Observable<MessageEvent>((observer) => {
      this.deepSeekService.analyzeJavaScriptErrorStream(
        errorStack,
        sourceContext,
        projectId,
        (chunk: string, progress: number) => {
          observer.next({
            data: JSON.stringify({
              type: 'progress',
              progress,
              message: chunk
            })
          });
        }
      )
        .then((result) => {
          if (result) {
            observer.next({
              data: JSON.stringify({
                type: 'complete',
                result: result
              })
            });
          } else {
            observer.next({
              data: JSON.stringify({
                type: 'error',
                message: 'AI分析失败'
              })
            });
          }
          observer.complete();
        })
        .catch((error) => {
          observer.next({
            data: JSON.stringify({
              type: 'error',
              message: error.message
            })
          });
          observer.complete();
        });
    });
  }
}
