import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsEnum, IsBoolean } from 'class-validator';

/**
 * 用户角色枚举
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

/**
 * 创建用户DTO
 * 用于验证创建用户时的请求数据
 */
export class CreateUserDto {
  /**
   * 用户名
   * @example admin
   */
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  username: string;

  /**
   * 邮箱地址
   * @example admin@example.com
   */
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  /**
   * 密码
   * @example password123
   */
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度至少6位' })
  password: string;

  /**
   * 用户角色
   * @example admin
   */
  @IsOptional()
  @IsEnum(UserRole, { message: '角色必须是admin或user' })
  role?: UserRole = UserRole.USER;

  /**
   * 是否启用
   * @example true
   */
  @IsOptional()
  @IsBoolean({ message: '启用状态必须是布尔值' })
  enabled?: boolean = true;
}