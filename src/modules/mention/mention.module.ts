import { Module } from '@nestjs/common';
import { MentionService } from './mention.service';
import { UserModule } from '../../shared/user';
import { GroupModule } from '../../shared/group';

@Module({
  imports: [UserModule, GroupModule],
  providers: [MentionService],
  exports: [MentionService],
})
export class MentionModule {}
