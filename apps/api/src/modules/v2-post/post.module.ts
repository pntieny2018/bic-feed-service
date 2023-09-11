import { EventModule } from '@libs/infra/event';
import { KafkaModule } from '@libs/infra/kafka';
import { QueueModule } from '@libs/infra/queue';
import { GroupModule } from '@libs/service/group/group.module';
import { MediaModule as LibMediaModule } from '@libs/service/media/media.module';
import { UserModule } from '@libs/service/user/user.module';
import { HttpModule } from '@nestjs/axios';
import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DatabaseModule } from '../../database';
import { NotificationModule } from '../../notification';
import { AuthorityModule } from '../authority';
import { MediaModule } from '../media';
import { SearchModule } from '../search';
import { GroupModuleV2 } from '../v2-group/group.module';
import { UserModuleV2 } from '../v2-user/user.module';

import { CONTENT_BINDING_TOKEN, ContentBinding } from './application/binding';
import { ContentDomainService } from './domain/domain-service/content.domain-service';
import { CONTENT_DOMAIN_SERVICE_TOKEN } from './domain/domain-service/interface';
import { ArticleConsumer } from './driving-apdater/consumer/article.consumer';
import { PostConsumer } from './driving-apdater/consumer/post.consumer';
import { SeriesConsumer } from './driving-apdater/consumer/series.consumer';
import { ArticleController } from './driving-apdater/controller/article.controller';
import { CategoryController } from './driving-apdater/controller/category.controller';
import { CommentController } from './driving-apdater/controller/comment.controller';
import { ContentController } from './driving-apdater/controller/content.controller';
import { NewsFeedController } from './driving-apdater/controller/newsfeed.controller';
import { PostController } from './driving-apdater/controller/post.controller';
import { QuizController } from './driving-apdater/controller/quiz.controller';
import { ReactionController } from './driving-apdater/controller/reaction.controller';
import { SeriesController } from './driving-apdater/controller/series.controller';
import { TagController } from './driving-apdater/controller/tag.controller';
import { TimelineController } from './driving-apdater/controller/timeline.controller';
import { QuizProcessor } from './driving-apdater/queue-processor/quiz.processor';
import {
  categoryProvider,
  commentProvider,
  linkPreviewProvider,
  sharedProvider,
  tagProvider,
  postProvider,
  mediaProvider,
  reactionProvider,
  adapterProvider,
} from './provider';
import { quizProvider } from './provider/quiz.provider';

@Module({
  imports: [
    HttpModule,
    CqrsModule,
    DatabaseModule,
    AuthorityModule,
    GroupModuleV2,
    UserModuleV2,
    MediaModule,
    KafkaModule,
    forwardRef(() => SearchModule),
    NotificationModule,
    QueueModule,
    EventModule,
    UserModule,
    GroupModule,
    LibMediaModule,
  ],
  controllers: [
    TagController,
    CategoryController,
    PostController,
    ArticleController,
    ContentController,
    ReactionController,
    TimelineController,
    NewsFeedController,
    CommentController,
    PostConsumer,
    SeriesConsumer,
    ArticleConsumer,
    SeriesController,
    QuizController,
  ],
  providers: [
    ...adapterProvider,
    ...tagProvider,
    ...categoryProvider,
    ...postProvider,
    ...linkPreviewProvider,
    ...mediaProvider,
    ...commentProvider,
    ...sharedProvider,
    ...reactionProvider,
    ...quizProvider,
    QuizProcessor,
  ],
  exports: [
    ...quizProvider,
    {
      provide: CONTENT_BINDING_TOKEN,
      useClass: ContentBinding,
    },
    {
      provide: CONTENT_DOMAIN_SERVICE_TOKEN,
      useClass: ContentDomainService,
    },
  ],
})
export class PostModuleV2 {}
