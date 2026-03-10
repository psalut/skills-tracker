import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { SkillLevel } from '@prisma/client';

export class UpdateUserSkillDto {
  @ApiPropertyOptional({
    description: 'Updated current level of the user for this skill',
    enum: SkillLevel,
    example: SkillLevel.INTERMEDIATE,
  })
  @IsOptional()
  @IsEnum(SkillLevel)
  currentLevel?: SkillLevel;

  @ApiPropertyOptional({
    description: 'Updated target level for this skill',
    enum: SkillLevel,
    example: SkillLevel.EXPERT,
  })
  @IsOptional()
  @IsEnum(SkillLevel)
  targetLevel?: SkillLevel;

  @ApiPropertyOptional({
    description: 'Updated notes about the progress for this skill',
    example: 'Now focusing on advanced backend architecture patterns.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
