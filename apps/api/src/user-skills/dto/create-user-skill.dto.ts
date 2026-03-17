import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { SkillLevel } from '@prisma/client';

export class CreateUserSkillDto {
  @ApiProperty({
    description: 'Skill ID',
    example: 'cm8xv52x90002abc123def789',
  })
  @IsString()
  skillId!: string;

  @ApiPropertyOptional({
    description: 'Current level of the user for this skill',
    enum: SkillLevel,
    example: SkillLevel.BEGINNER,
  })
  @IsOptional()
  @IsEnum(SkillLevel)
  currentLevel?: SkillLevel;

  @ApiPropertyOptional({
    description: 'Additional notes about the user progress on this skill',
    example: 'Practicing with personal projects and reading official docs.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
