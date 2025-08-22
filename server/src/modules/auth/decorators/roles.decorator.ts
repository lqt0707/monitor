import { SetMetadata } from '@nestjs/common';

/**
 * 角色装饰器
 * 用于标记需要特定角色才能访问的路由
 * @param roles 允许访问的角色列表
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);