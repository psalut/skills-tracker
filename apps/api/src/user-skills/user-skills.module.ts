import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UserSkillsController } from '../user-skills/user-skills.controller';
import { UserSkillsService } from '../user-skills/user-skills.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserSkillsController],
  providers: [UserSkillsService],
  exports: [UserSkillsService],
})
export class UserSkillsModule {}
