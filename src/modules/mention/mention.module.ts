import { Module } from '@nestjs/common';
import { MentionService } from './mention.service';
import { ValidateMentionConstraint } from './validators/validate-mention.validator';
import { UserModuleV2 } from '../v2-user/user.module';
import { GroupModuleV2 } from '../v2-group/group.module';

@Module({
  imports: [UserModuleV2, GroupModuleV2],
  providers: [MentionService, ValidateMentionConstraint],
  exports: [MentionService],
})
export class MentionModule {}
