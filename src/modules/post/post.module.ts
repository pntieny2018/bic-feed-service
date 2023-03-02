import { MediaModule } from '../media';
import { UserModule } from '../../shared/user';
import { forwardRef, Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MentionModule } from '../mention';
import { PostPolicyService } from './post-policy.service';
import { GroupModule } from '../../shared/group';
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
    GroupModule,
    MediaModule,
    MentionModule,
    forwardRef(() => ReactionModule),
    AuthorityModule,
    forwardRef(() => CommentModule),
    forwardRef(() => FeedModule),
    forwardRef(() => LinkPreviewModule),
    TagModule,
  ],
  controllers: [PostController, PostConsumerController],
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
