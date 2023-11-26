import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaOptions, Transport } from '@nestjs/microservices';

import { AuthorityModule } from '../authority';
import { CommentModule } from '../comment';
import { LinkPreviewModule } from '../link-preview/link-preview.module';
import { MediaModule } from '../media';
import { MentionModule } from '../mention';
import { ReactionModule } from '../reaction';
import { TagModule } from '../tag';
import { GroupModuleV2 } from '../v2-group/group.module';
import { UserModuleV2 } from '../v2-user/user.module';

import { PostAppService } from './application/post.app-service';
import { ContentController } from './content.controller';
import { FeedBackupController } from './feed-backup.controller';
import { PostBindingService } from './post-binding.service';
import { PostCronService } from './post-cron.service';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { IKafkaConfig } from '@libs/infra/kafka/config';

export const register = async (config: ConfigService): Promise<KafkaOptions> => {
  const kafkaConfig = config.get<IKafkaConfig>('kafka');
  return {
    transport: Transport.KAFKA,
    options: kafkaConfig,
  };
};

@Module({
  imports: [
    UserModuleV2,
    GroupModuleV2,
    MediaModule,
    MentionModule,
    ReactionModule,
    AuthorityModule,
    forwardRef(() => CommentModule),
    LinkPreviewModule,
    TagModule,
  ],
  controllers: [PostController, ContentController, FeedBackupController],
  providers: [PostService, PostBindingService, PostCronService, PostAppService],
  exports: [PostService, PostBindingService],
})
export class PostModule {}
