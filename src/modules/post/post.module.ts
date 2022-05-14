import { MediaModule } from '../media';
import { UserModule } from '../../shared/user';
import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MentionModule } from '../mention';
import { PostPolicyService } from './post-policy.service';
import { GroupModule } from '../../shared/group';
import { CommentModule } from '../comment';
import { AuthorityModule } from '../authority';
import { LibModule } from '../../app/lib.module';
import { ReactionModule } from '../reaction';
import { FeedModule } from '../feed';
import { ClientsModule, KafkaOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { IKafkaConfig } from '../../config/kafka';
export const register = async (config: ConfigService): Promise<KafkaOptions> => {
  const kafkaConfig = config.get<IKafkaConfig>('kafka');
  return {
    transport: Transport.KAFKA,
    options: kafkaConfig,
  };
};
@Module({
  imports: [
    DatabaseModule,
    UserModule,
    GroupModule,
    MediaModule,
    MentionModule,
    forwardRef(() => ReactionModule),
    AuthorityModule,
    LibModule,
    forwardRef(() => CommentModule),
    forwardRef(() => FeedModule),
    ClientsModule.registerAsync([
      {
        name: 'post_xxx',
        useFactory: register,
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [PostController],
  providers: [PostService, PostPolicyService],
  exports: [PostService, PostPolicyService],
})
export class PostModule {}
