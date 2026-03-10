import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserSkillsService } from './user-skills.service';
import { CreateUserSkillDto } from './dto/create-user-skill.dto';
import { UpdateUserSkillDto } from './dto/update-user-skill.dto';

@ApiTags('User Skills')
@Controller()
export class UserSkillsController {
  constructor(private readonly userSkillsService: UserSkillsService) {}

  @Post('user-skills')
  @ApiOperation({
    summary: 'Create a user-skill relation',
    description:
      'Creates a relation between a user and a skill, optionally storing current level, target level, and notes.',
  })
  @ApiBody({ type: CreateUserSkillDto })
  @ApiCreatedResponse({
    description: 'User-skill relation created successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body or invalid enum values.',
  })
  @ApiNotFoundResponse({
    description: 'User not found or active skill not found.',
  })
  @ApiConflictResponse({
    description: 'The user already has this skill assigned.',
  })
  create(@Body() createUserSkillDto: CreateUserSkillDto) {
    return this.userSkillsService.create(createUserSkillDto);
  }

  @Get('user-skills')
  @ApiOperation({
    summary: 'Get all user-skill relations',
    description: 'Returns all user-skill relations with related user and skill data.',
  })
  @ApiOkResponse({
    description: 'User-skill relations retrieved successfully.',
  })
  findAll() {
    return this.userSkillsService.findAll();
  }

  @Get('user-skills/:id')
  @ApiOperation({
    summary: 'Get a user-skill relation by id',
  })
  @ApiParam({
    name: 'id',
    description: 'UserSkill ID',
    example: 'cm8xv4r3b0001abc123def456',
  })
  @ApiOkResponse({
    description: 'User-skill relation retrieved successfully.',
  })
  @ApiNotFoundResponse({
    description: 'User-skill relation not found.',
  })
  findOne(@Param('id') id: string) {
    return this.userSkillsService.findOne(id);
  }

  @Get('users/:userId/skills')
  @ApiOperation({
    summary: 'Get all skills for a user',
    description: 'Returns all skills associated with a specific user.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 'cm8xv4r3b0001abc123def456',
  })
  @ApiOkResponse({
    description: 'User skills retrieved successfully.',
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
  })
  findByUser(@Param('userId') userId: string) {
    return this.userSkillsService.findByUser(userId);
  }

  @Patch('user-skills/:id')
  @ApiOperation({
    summary: 'Update a user-skill relation',
    description:
      'Updates current level, target level, and/or notes for an existing user-skill relation.',
  })
  @ApiParam({
    name: 'id',
    description: 'UserSkill ID',
    example: 'cm8xv4r3b0001abc123def456',
  })
  @ApiBody({ type: UpdateUserSkillDto })
  @ApiOkResponse({
    description: 'User-skill relation updated successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body or invalid enum values.',
  })
  @ApiNotFoundResponse({
    description: 'User-skill relation not found.',
  })
  update(
    @Param('id') id: string,
    @Body() updateUserSkillDto: UpdateUserSkillDto,
  ) {
    return this.userSkillsService.update(id, updateUserSkillDto);
  }

  @Delete('user-skills/:id')
  @ApiOperation({
    summary: 'Delete a user-skill relation',
  })
  @ApiParam({
    name: 'id',
    description: 'UserSkill ID',
    example: 'cm8xv4r3b0001abc123def456',
  })
  @ApiOkResponse({
    description: 'User-skill relation deleted successfully.',
  })
  @ApiNotFoundResponse({
    description: 'User-skill relation not found.',
  })
  remove(@Param('id') id: string) {
    return this.userSkillsService.remove(id);
  }
}