import { Module } from '@nestjs/common';
import { MentionService } from './mention.service';
import { UserModule } from '../../shared/user';

@Module({
  imports: [UserModule],
  providers: [MentionService],
  exports: [MentionService],
})
export class MentionModule {}
