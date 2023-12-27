import { Module } from '@nestjs/common';

import { ArticleModule } from '../modules/article';
import { CommentModule } from '../modules/comment';
import { FeedModule } from '../modules/feed';
import { FeedPublisherModule } from '../modules/feed-publisher';
import { FollowModule } from '../modules/follow';
import { MediaModule } from '../modules/media';
import { PostModule } from '../modules/post';
import { SearchModule } from '../modules/search';
import { SeriesModule } from '../modules/series';
import { TagModule } from '../modules/tag';
import { NotificationModule } from '../notification';

import { ArticleListener } from './article';
import {
  SeriesAddedItemsListener,
  SeriesRemovedItemsListener,
  SeriesReorderItemsListener,
} from './series';
import { SeriesChangedItemsListener } from './series/series-changed-items.listener';

@Module({
  imports: [
    FollowModule,
    PostModule,
    CommentModule,
    NotificationModule,
    FeedPublisherModule,
    MediaModule,
    FeedModule,
    SeriesModule,
    ArticleModule,
    SearchModule,
    TagModule,
  ],
  providers: [
    ArticleListener,
    SeriesAddedItemsListener,
    SeriesRemovedItemsListener,
    SeriesReorderItemsListener,
    SeriesChangedItemsListener,
  ],
})
export class ListenerModule {}
