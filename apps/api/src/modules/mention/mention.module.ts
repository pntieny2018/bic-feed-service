import { UserModule as LibUserModule } from '@libs/service/user';
import { Module } from '@nestjs/common';

import { MentionService } from './mention.service';
import { ValidateMentionConstraint } from './validators/validate-mention.validator';

@Module({
  imports: [LibUserModule],
  providers: [MentionService, ValidateMentionConstraint],
  exports: [MentionService],
})
export class MentionModule {}
