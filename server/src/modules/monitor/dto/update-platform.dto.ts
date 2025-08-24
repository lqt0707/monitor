import { PartialType } from '@nestjs/swagger';
import { CreatePlatformDto } from './create-platform.dto';

/**
 * 更新平台DTO
 */
export class UpdatePlatformDto extends PartialType(CreatePlatformDto) {}