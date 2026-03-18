import { Body, Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SelfOrAdmin } from '../auth/decorators/self-or-admin.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SelfOrAdminGuard } from '../auth/guards/self-or-admin.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Restricted to ADMIN users.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users',
  })
  @ApiForbiddenResponse({
    description: 'Only ADMIN users can list all users.',
  })
  findMany() {
    return this.usersService.findMany();
  }

  @Get(':id')
  @SelfOrAdmin('id')
  @UseGuards(SelfOrAdminGuard)
  @ApiOperation({
    summary: 'Get user by id',
    description: 'Available to the profile owner or an ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'cmmed2xx80000oc0kwib5qltv',
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiForbiddenResponse({
    description: 'Only the profile owner or an ADMIN can access this user.',
  })
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @SelfOrAdmin('id')
  @UseGuards(SelfOrAdminGuard)
  @ApiOperation({
    summary: 'Update user',
    description: 'Available to the profile owner or an ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'c0f9a1c2-1234-4b8b-8b8f-2d5e5f2b1234',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiForbiddenResponse({
    description: 'Only the profile owner or an ADMIN can update this user.',
  })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
