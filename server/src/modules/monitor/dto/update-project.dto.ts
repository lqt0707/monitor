import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

/**
 * 更新项目DTO
 */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}