import { MediaModule } from '../media';
import { forwardRef, Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MentionModule } from '../mention';
import { PostPolicyService } from './post-policy.service';
import { CommentModule } from '../comment';
import { AuthorityModule } from '../authority';
import { ReactionModule } from '../reaction';
import { FeedModule } from '../feed';
import { KafkaOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { IKafkaConfig } from '../../config/kafka';
import { PostConsumerController } from './post-consummer.controller';
import { PostBindingService } from './post-binding.service';
import { PostHistoryService } from './post-history.service';
import { PostCronService } from './post-cron.service';
import { LinkPreviewModule } from '../link-preview/link-preview.module';
import { PostAppService } from './application/post.app-service';
import { TagModule } from '../tag';
import { UserModuleV2 } from '../v2-user/user.module';
import { GroupModuleV2 } from '../v2-group/group.module';
import { ContentController } from './content.controller';
import { FeedBackupController } from './feed-backup.controller';

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
    forwardRef(() => ReactionModule),
    AuthorityModule,
    forwardRef(() => CommentModule),
    forwardRef(() => FeedModule),
    LinkPreviewModule,
    TagModule,
  ],
  controllers: [PostController, PostConsumerController, ContentController, FeedBackupController],
  providers: [
    PostService,
    PostBindingService,
    PostPolicyService,
    PostHistoryService,
    PostCronService,
    PostAppService,
  ],
  exports: [PostService, PostBindingService, PostPolicyService, PostHistoryService],
})
export class PostModule {}
