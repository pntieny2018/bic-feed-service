import { Module } from '@nestjs/common';
import { SequelizeTinkerCommand } from './sequelize-tinker.command';
import { FixCommentCountCommand } from './fix-comment-count.command';
import { FixPostCommentCountCommand } from './fix-post-comment-count.command';
import { ReIndexEsPostCommand } from './re-index-es-post.command';
import { DatabaseModule } from '../database';
import { LibModule } from '../app/lib.module';
import { UserModule } from '../shared/user';
import { GroupModule } from '../shared/group';

@Module({
  imports: [DatabaseModule, LibModule, UserModule, GroupModule],
  providers: [
    SequelizeTinkerCommand,
    FixCommentCountCommand,
    FixPostCommentCountCommand,
    ReIndexEsPostCommand,
  ],
})
export class CommandModule {}
