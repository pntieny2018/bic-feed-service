import { Module } from '@nestjs/common';
import { MentionService } from './mention.service';
import { UserModule } from '../../shared/user';
import { GroupModule } from '../../shared/group';
import { ValidateMentionConstraint } from './validators/validate-mention.validator';

@Module({
  imports: [UserModule, GroupModule],
  providers: [MentionService, ValidateMentionConstraint],
  exports: [MentionService],
})
export class MentionModule {}
