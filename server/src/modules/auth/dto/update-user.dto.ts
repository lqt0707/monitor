import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MinLength, IsEnum, IsBoolean } from 'class-validator';
import { CreateUserDto, UserRole } from './create-user.dto';

/**
 * 更新用户DTO
 * 继承创建用户DTO，所有字段都是可选的
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
  /**
   * 新密码（可选）
   * @example newpassword123
   */
  @IsOptional()
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度至少6位' })
  password?: string;

  /**
   * 用户角色（可选）
   * @example user
   */
  @IsOptional()
  @IsEnum(UserRole, { message: '角色必须是admin或user' })
  role?: UserRole;

  /**
   * 是否启用（可选）
   * @example false
   */
  @IsOptional()
  @IsBoolean({ message: '启用状态必须是布尔值' })
  enabled?: boolean;
}