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
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
export const register = async (config: ConfigService): Promise<KafkaOptions> => {
  const kafkaConfig = config.get<IKafkaConfig>('kafka');
  return {
    transport: Transport.KAFKA,
    options: kafkaConfig,
  };
};
@Module({
  imports: [
    UserModule,
    GroupModule,
    MediaModule,
    MentionModule,
    forwardRef(() => ReactionModule),
    AuthorityModule,
    forwardRef(() => CommentModule),
    forwardRef(() => FeedModule),
  ],
  controllers: [PostController, ArticleController],
  providers: [PostService, PostPolicyService, ArticleService],
  exports: [PostService, PostPolicyService],
})
export class PostModule {}
