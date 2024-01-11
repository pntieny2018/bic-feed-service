import { GroupModule } from '@libs/service/group';
import { UserModule as LibUserModule } from '@libs/service/user';
import { Module } from '@nestjs/common';

import { AuthorityModule } from '../authority';

import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  imports: [LibUserModule, GroupModule, AuthorityModule],
  providers: [FeedService],
  controllers: [FeedController],
  exports: [FeedService],
})
export class FeedModule {}
