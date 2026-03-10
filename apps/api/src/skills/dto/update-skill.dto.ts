import { SkillCategory } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateSkillDto {
  @ApiPropertyOptional({
    description: 'Skill name',
    example: 'NestJS',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({
    description: 'Optional skill description',
    example:
      'Framework for building scalable backend applications with Node.js',
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
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'Parent skill id. Send null to remove the parent and convert the skill into a root skill',
    example: 'clx123abc456def789ghi012',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  parentSkillId?: string | null;
}
