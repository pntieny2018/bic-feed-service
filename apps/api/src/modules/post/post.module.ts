import { MediaModule } from '../media';
import { forwardRef, Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MentionModule } from '../mention';
import { CommentModule } from '../comment';
import { AuthorityModule } from '../authority';
import { ReactionModule } from '../reaction';
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
import { SearchModule } from '../search';

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
    forwardRef(() => SearchModule),
    forwardRef(() => CommentModule),
    LinkPreviewModule,
    TagModule,
  ],
  controllers: [PostController, PostConsumerController, ContentController, FeedBackupController],
  providers: [PostService, PostBindingService, PostHistoryService, PostCronService, PostAppService],
  exports: [PostService, PostBindingService, PostHistoryService],
})
export class PostModule {}
