import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../database';
import { GroupModuleV2 } from '../v2-group/group.module';
import { TagController } from './driving-apdater/controller/tag.controller';
import { ArticleController } from './driving-apdater/controller/article.controller';
import {
  categoryProvider,
  commentProvider,
  linkPreviewProvider,
  sharedProvider,
  tagProvider,
  postProvider,
  mediaProvider,
  reactionProvider,
} from './provider';
import { UserModuleV2 } from '../v2-user/user.module';
import { CategoryController } from './driving-apdater/controller/category.controller';
import { AuthorityModule } from '../authority';
import { PostController } from './driving-apdater/controller/post.controller';
import { ReactionController } from './driving-apdater/controller/reaction.controller';
import { HttpModule } from '@nestjs/axios';
import { CommentController } from './driving-apdater/controller/comment.controller';
import { PostConsumer } from './driving-apdater/consumer/post.consumer';
import { MediaModule } from '../media';
import { NotificationModule } from '../../notification';
import { KafkaModule } from '@app/kafka';
import { SeriesController } from './driving-apdater/controller/series.controller';
import { ContentController } from './driving-apdater/controller/content.controller';
import { TimelineController } from './driving-apdater/controller/timeline.controller';
import { NewsFeedController } from './driving-apdater/controller/newsfeed.controller';
import { QuizController } from './driving-apdater/controller/quiz.controller';
import { SeriesConsumer } from './driving-apdater/consumer/series.consumer';
import { ArticleConsumer } from './driving-apdater/consumer/article.consumer';

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
    NotificationModule,
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
    ...tagProvider,
    ...categoryProvider,
    ...postProvider,
    ...linkPreviewProvider,
    ...mediaProvider,
    ...commentProvider,
    ...sharedProvider,
    ...reactionProvider,
  ],
})
export class PostModuleV2 {}
