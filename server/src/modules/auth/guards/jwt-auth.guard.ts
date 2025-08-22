import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT认证守卫
 * 用于保护需要JWT令牌认证的路由
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}