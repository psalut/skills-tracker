import { SkillCategory } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({
    description: 'Skill name',
    example: 'NestJS',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({
    description: 'Optional skill description',
    example: 'Node.js framework for building scalable server-side applications',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Skill category',
    enum: SkillCategory,
    example: SkillCategory.BACKEND,
  })
  @IsOptional()
  @IsEnum(SkillCategory)
  category?: SkillCategory;

  @ApiPropertyOptional({
    description: 'Whether the skill is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Parent skill id when this skill is a sub-skill',
    example: 'clx123abc456def789ghi012',
  })
  @IsOptional()
  @IsString()
  parentSkillId?: string;
}
