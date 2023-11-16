import { Module } from '@nestjs/common';

import { ArticleModule } from '../modules/article';
import { CommentModule } from '../modules/comment';
import { FeedModule } from '../modules/feed';
import { FeedPublisherModule } from '../modules/feed-publisher';
import { FilterUserModule } from '../modules/filter-user';
import { FollowModule } from '../modules/follow';
import { MediaModule } from '../modules/media';
import { PostModule } from '../modules/post';
import { SearchModule } from '../modules/search';
import { SeriesModule } from '../modules/series';
import { TagModule } from '../modules/tag';
import { GroupModuleV2 } from '../modules/v2-group/group.module';
import { UserModuleV2 } from '../modules/v2-user/user.module';
import { NotificationModule } from '../notification';

import { ArticleListener } from './article';
import { CommentListener } from './comment';
import { ReportContentListener } from './report';
import {
  SeriesAddedItemsListener,
  SeriesRemovedItemsListener,
  SeriesReorderItemsListener,
} from './series';
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
    CommentListener,
    ArticleListener,
    SeriesAddedItemsListener,
    SeriesRemovedItemsListener,
    SeriesReorderItemsListener,
    ReportContentListener,
    SeriesChangedItemsListener,
  ],
})
export class ListenerModule {}
