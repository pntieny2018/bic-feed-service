import { PostListener } from './post';
import { Module } from '@nestjs/common';
import { CommentListener } from './comment';
import { PostModule } from '../modules/post';
import { ReactionListener } from './reaction';
import { NotificationModule } from '../notification';
import { FeedPublisherModule } from '../modules/feed-publisher';
import { CommentModule } from '../modules/comment';
import { MediaModule } from '../modules/media';
import { FeedModule } from '../modules/feed';
import { SeriesModule } from '../modules/series';
import { ArticleListener } from './article';
import { ArticleModule } from '../modules/article';
import {
  SeriesAddedItemsListener,
  SeriesListener,
  SeriesRemovedItemsListener,
  SeriesReorderItemsListener,
} from './series';
import { SearchModule } from '../modules/search';
import { ReportContentListener } from './report';
import { TagModule } from '../modules/tag';
import { FilterUserModule } from '../modules/filter-user';
import { FollowModule } from '../modules/follow';
import { UserModuleV2 } from '../modules/v2-user/user.module';
import { GroupModuleV2 } from '../modules/v2-group/group.module';
import { SeriesChangedItemsListener } from './series/series-changed-items.listener';

@Module({
  imports: [
    FollowModule,
    FilterUserModule,
    GroupModuleV2,
    PostModule,
    CommentModule,
    NotificationModule,
    FeedPublisherModule,
    MediaModule,
    UserModuleV2,
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
    SeriesAddedItemsListener,
    SeriesRemovedItemsListener,
    SeriesReorderItemsListener,
    ReportContentListener,
    SeriesChangedItemsListener,
  ],
})
export class ListenerModule {}
