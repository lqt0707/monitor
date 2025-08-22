import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService, LoginDto, LoginResponse } from './auth.service';

/**
 * 认证控制器
 * 提供用户登录、登出等认证相关的API接口
 */
@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户登录
   * @param loginDto 登录信息
   * @returns 登录响应
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  @ApiBody({
    description: '登录信息',
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description: '用户名',
          example: 'admin',
        },
        password: {
          type: 'string',
          description: '密码',
          example: 'admin123',
        },
      },
      required: ['username', 'password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '登录成功' },
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                username: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      code: 200,
      message: '登录成功',
      success: true,
      data: result,
    };
  }

  /**
   * 用户登出
   * @returns 登出响应
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登出' })
  @ApiResponse({ status: 200, description: '登出成功' })
  async logout() {
    // 在JWT模式下，登出主要是客户端删除token
    // 服务端可以维护一个黑名单来处理已登出的token
    return {
      code: 200,
      message: '登出成功',
      success: true,
      data: null,
    };
  }
}