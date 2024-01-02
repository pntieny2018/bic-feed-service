import { LibReportDetailRepository, LibReportRepository } from '@libs/database/postgres/repository';
import { IKafkaConfig } from '@libs/infra/kafka/config';
import { UserModule as LibUserModule } from '@libs/service/user';
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

import { PostAppService } from './application/post.app-service';
import { ContentController } from './content.controller';
import { FeedBackupController } from './feed-backup.controller';
import { PostBindingService } from './post-binding.service';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { GroupModule } from '@libs/service/group';

export const register = async (config: ConfigService): Promise<KafkaOptions> => {
  const kafkaConfig = config.get<IKafkaConfig>('kafka');
  return {
    transport: Transport.KAFKA,
    options: kafkaConfig,
  };
};

@Module({
  imports: [
    GroupModule,
    MediaModule,
    MentionModule,
    ReactionModule,
    AuthorityModule,
    forwardRef(() => CommentModule),
    LinkPreviewModule,
    TagModule,
    LibUserModule,
  ],
  controllers: [PostController, ContentController, FeedBackupController],
  providers: [
    PostService,
    PostBindingService,
    PostAppService,
    LibReportRepository,
    LibReportDetailRepository,
  ],
  exports: [PostService, PostBindingService],
})
export class PostModule {}
