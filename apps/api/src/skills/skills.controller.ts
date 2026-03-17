import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { SkillsService } from './skills.service';

@ApiTags('Skills')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Create a new skill',
    description:
      'Creates a new skill. Optionally it can be created as a sub-skill of another skill.',
  })
  @ApiBody({ type: CreateSkillDto })
  @ApiCreatedResponse({
    description: 'Skill successfully created',
  })
  @ApiBadRequestResponse({
    description: 'Invalid data or duplicated skill at the same level',
  })
  @ApiNotFoundResponse({
    description: 'Parent skill not found',
  })
  create(@Body() createSkillDto: CreateSkillDto) {
    return this.skillsService.create(createSkillDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all skills',
    description: 'Returns all active skills (excluding soft deleted ones).',
  })
  @ApiOkResponse({
    description: 'List of skills',
  })
  findAll() {
    return this.skillsService.findAll();
  }

  @Get('roots')
  @ApiOperation({
    summary: 'Get root skills',
    description:
      'Returns all skills that do not have a parent (top-level skills).',
  })
  @ApiOkResponse({
    description: 'List of root skills',
  })
  findRoots() {
    return this.skillsService.findRoots();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a skill by id',
  })
  @ApiParam({
    name: 'id',
    description: 'Skill id',
    example: 'clx123abc456def789ghi012',
  })
  @ApiOkResponse({
    description: 'Skill found',
  })
  @ApiNotFoundResponse({
    description: 'Skill not found',
  })
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Update a skill',
  })
  @ApiParam({
    name: 'id',
    description: 'Skill id',
    example: 'clx123abc456def789ghi012',
  })
  @ApiBody({ type: UpdateSkillDto })
  @ApiOkResponse({
    description: 'Skill successfully updated',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid update (circular parent relationship or duplicated name)',
  })
  @ApiNotFoundResponse({
    description: 'Skill or parent skill not found',
  })
  update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto) {
    return this.skillsService.update(id, updateSkillDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Delete a skill',
    description:
      'Soft deletes a skill. A skill cannot be deleted if it has sub-skills.',
  })
  @ApiParam({
    name: 'id',
    description: 'Skill id',
    example: 'clx123abc456def789ghi012',
  })
  @ApiOkResponse({
    description: 'Skill successfully deleted',
  })
  @ApiBadRequestResponse({
    description: 'Cannot delete a skill that has sub-skills',
  })
  @ApiNotFoundResponse({
    description: 'Skill not found',
  })
  remove(@Param('id') id: string) {
    return this.skillsService.remove(id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Restore a soft-deleted skill',
    description:
      'Restores a previously soft-deleted skill. If the skill has a parent, the parent must exist and not be deleted.',
  })
  @ApiParam({
    name: 'id',
    description: 'Skill id',
    example: 'clx123abc456def789ghi012',
  })
  @ApiOkResponse({
    description: 'Skill successfully restored',
  })
  @ApiBadRequestResponse({
    description:
      'Cannot restore a skill whose parent does not exist or is deleted',
  })
  @ApiNotFoundResponse({
    description: 'Skill not found',
  })
  restore(@Param('id') id: string) {
    return this.skillsService.restore(id);
  }
}
