import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * 用户管理控制器
 * 提供用户的CRUD操作接口
 */
@ApiTags('用户管理')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 创建新用户
   * @param createUserDto 创建用户数据
   * @returns 创建的用户信息
   */
  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '创建新用户' })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.createUser(createUserDto);
    return {
      code: 201,
      message: '用户创建成功',
      success: true,
      data: user,
    };
  }

  /**
   * 获取所有用户列表
   * @returns 用户列表
   */
  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '获取所有用户列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async findAll() {
    const users = await this.authService.findAllUsers();
    return {
      code: 200,
      message: '获取用户列表成功',
      success: true,
      data: users,
    };
  }

  /**
   * 根据ID获取用户信息
   * @param id 用户ID
   * @returns 用户信息
   */
  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: '根据ID获取用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.authService.findUserById(id);
    return {
      code: 200,
      message: '获取用户信息成功',
      success: true,
      data: user,
    };
  }

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param updateUserDto 更新数据
   * @returns 更新后的用户信息
   */
  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: '更新用户信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.authService.updateUser(id, updateUserDto);
    return {
      code: 200,
      message: '用户更新成功',
      success: true,
      data: user,
    };
  }

  /**
   * 删除用户
   * @param id 用户ID
   * @returns 删除结果
   */
  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '删除用户' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.authService.deleteUser(id);
    return {
      code: 200,
      message: result.message,
      success: true,
    };
  }
}