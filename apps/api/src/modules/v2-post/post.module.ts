import { EventModule } from '@libs/infra/event';
import { KafkaModule } from '@libs/infra/kafka';
import { QueueModule } from '@libs/infra/queue';
import { GroupModule } from '@libs/service/group/group.module';
import { MediaModule as LibMediaModule } from '@libs/service/media/media.module';
import { OpenaiModule } from '@libs/service/openai';
import { UserModule } from '@libs/service/user/user.module';
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { NotificationModule } from '../../notification';
import { AuthorityModule } from '../authority';
import { SearchModule } from '../search';
import { NotificationModuleV2 } from '../v2-notification/notification.module';
import { WebSocketModule } from '../ws/ws.module';

import { CONTENT_BINDING_TOKEN, ContentBinding } from './application/binding';
import { ContentDomainService } from './domain/domain-service/content.domain-service';
import { CONTENT_DOMAIN_SERVICE_TOKEN } from './domain/domain-service/interface';
import { REPORT_REPOSITORY_TOKEN } from './domain/repositoty-interface';
import { ReportRepository } from './driven-adapter/repository';
import { ArticleController } from './driving-apdater/controller/article.controller';
import { CategoryController } from './driving-apdater/controller/category.controller';
import { CommentController } from './driving-apdater/controller/comment.controller';
import { ContentController } from './driving-apdater/controller/content.controller';
import { ManageController } from './driving-apdater/controller/manage.controller';
import { NewsFeedController } from './driving-apdater/controller/newsfeed.controller';
import { PostController } from './driving-apdater/controller/post.controller';
import { QuizController } from './driving-apdater/controller/quiz.controller';
import { ReactionController } from './driving-apdater/controller/reaction.controller';
import { SeriesController } from './driving-apdater/controller/series.controller';
import { TagController } from './driving-apdater/controller/tag.controller';
import { TimelineController } from './driving-apdater/controller/timeline.controller';
import {
  adapterProvider,
  categoryProvider,
  commentProvider,
  feedProvider,
  libRepositoryProvider,
  linkPreviewProvider,
  mediaProvider,
  notificationProvider,
  postProvider,
  quizProvider,
  reactionProvider,
  reportProvider,
  searchProvider,
  sharedProvider,
  tagProvider,
  webSocketProvider,
} from './provider';
import { workerProvider } from './provider/worker.provider';

@Module({
  imports: [
    CqrsModule,
    AuthorityModule,
    KafkaModule,
    NotificationModule,
    NotificationModuleV2,
    WebSocketModule,
    QueueModule,
    EventModule,
    OpenaiModule,
    GroupModule,
    UserModule,
    LibMediaModule,
    forwardRef(() => SearchModule),
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
    SeriesController,
    QuizController,
    ManageController,
  ],
  providers: [
    ...webSocketProvider, // NOTE: Temporarily only turned on in the dev/stg environment
    ...adapterProvider,
    ...categoryProvider,
    ...commentProvider,
    ...feedProvider,
    ...libRepositoryProvider,
    ...linkPreviewProvider,
    ...mediaProvider,
    ...notificationProvider,
    ...postProvider,
    ...quizProvider,
    ...reactionProvider,
    ...reportProvider,
    ...searchProvider,
    ...sharedProvider,
    ...tagProvider,
    ...workerProvider,
  ],
  exports: [
    {
      provide: CONTENT_BINDING_TOKEN,
      useClass: ContentBinding,
    },
    {
      provide: CONTENT_DOMAIN_SERVICE_TOKEN,
      useClass: ContentDomainService,
    },
    {
      provide: REPORT_REPOSITORY_TOKEN, // TODO: remove after remove old search module
      useClass: ReportRepository,
    },
  ],
})
export class PostModuleV2 {}
