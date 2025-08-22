import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';



/**
 * 登录请求DTO
 */
export interface LoginDto {
  username: string;
  password: string;
}

/**
 * 登录响应DTO
 */
export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}



/**
 * 认证服务
 * 处理用户登录、验证等功能
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * 验证用户凭据
   * @param username 用户名
   * @param password 密码
   * @returns 用户信息或null
   */
  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { username, enabled: true },
    });
    
    if (user && await bcrypt.compare(password, user.password)) {
      // 更新最后登录时间和IP（这里暂时不更新IP，可以在controller中获取）
      await this.userRepository.update(user.id, {
        lastLoginAt: new Date(),
      });
      
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * 用户登录
   * @param loginDto 登录信息
   * @returns 登录响应
   */
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * 验证JWT令牌
   * @param payload JWT载荷
   * @returns 用户信息
   */
  async validateJwtPayload(payload: any): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, enabled: true },
    });
    if (user) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * 生成密码哈希（用于创建测试用户）
   * @param password 明文密码
   * @returns 密码哈希
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * 创建新用户
   * @param createUserDto 创建用户数据
   * @returns 创建的用户信息（不包含密码）
   */
  async createUser(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { password, ...userData } = createUserDto;
    const hashedPassword = await this.hashPassword(password);
    
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });
    
    const savedUser = await this.userRepository.save(user);
    const { password: _, ...result } = savedUser;
    return result;
  }

  /**
   * 获取所有用户列表
   * @returns 用户列表（不包含密码）
   */
  async findAllUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find({
      select: ['id', 'username', 'email', 'role', 'enabled', 'lastLoginAt', 'createdAt', 'updatedAt'],
    });
    return users;
  }

  /**
   * 根据ID获取用户信息
   * @param id 用户ID
   * @returns 用户信息（不包含密码）
   */
  async findUserById(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'role', 'enabled', 'lastLoginAt', 'createdAt', 'updatedAt'],
    });
    
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    
    return user;
  }

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param updateUserDto 更新数据
   * @returns 更新后的用户信息（不包含密码）
   */
  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    
    const updateData = { ...updateUserDto };
    
    // 如果更新密码，需要加密
    if (updateData.password) {
      updateData.password = await this.hashPassword(updateData.password);
    }
    
    await this.userRepository.update(id, updateData);
    
    // 返回更新后的用户信息
    return this.findUserById(id);
  }

  /**
   * 删除用户
   * @param id 用户ID
   * @returns 删除结果
   */
  async deleteUser(id: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    
    await this.userRepository.delete(id);
    return { message: '用户删除成功' };
  }
}