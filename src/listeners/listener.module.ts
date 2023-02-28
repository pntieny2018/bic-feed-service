import { PostListener } from './post';
import { Module } from '@nestjs/common';
import { CommentListener } from './comment';
import { PostModule } from '../modules/post';
import { ReactionListener } from './reaction';
import { NotificationModule } from '../notification';
import { FeedPublisherModule } from '../modules/feed-publisher';
import { CommentModule } from '../modules/comment';
import { MediaModule } from '../modules/media';
import { UserModule } from '../shared/user';
import { FeedModule } from '../modules/feed';
import { SeriesModule } from '../modules/series';
import { ArticleListener } from './article';
import { ArticleModule } from '../modules/article';
import {
  SeriesAddedArticlesListener,
  SeriesListener,
  SeriesRemovedArticlesListener,
  SeriesReorderArticlesListener,
} from './series';
import { SearchModule } from '../modules/search';
import { ReportContentListener } from './report';
import { GroupModule } from '../shared/group';
import { TagModule } from '../modules/tag';
import { FilterUserModule } from '../modules/filter-user';
import { FollowModule } from '../modules/follow';

@Module({
  imports: [
    FollowModule,
    FilterUserModule,
    GroupModule,
    PostModule,
    CommentModule,
    NotificationModule,
    FeedPublisherModule,
    MediaModule,
    UserModule,
    FeedModule,
    SeriesModule,
    ArticleModule,
    SearchModule,
    TagModule,
  ],
  providers: [
    PostListener,
    CommentListener,
    ReactionListener,
    ArticleListener,
    SeriesListener,
    SeriesAddedArticlesListener,
    SeriesRemovedArticlesListener,
    SeriesReorderArticlesListener,
    ReportContentListener,
  ],
})
export class ListenerModule {}
