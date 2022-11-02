import { PostListener } from './post';
import { Module } from '@nestjs/common';
import { CommentListener } from './comment';
import { PostModule } from '../modules/post';
import { ReactionListener } from './reaction';
import { NotificationModule } from '../notification';
import { FeedPublisherModule } from '../modules/feed-publisher';
import { CommentModule } from '../modules/comment';
import { MediaModule } from '../modules/media';
import { FollowListener } from './follow/follow.listener';
import { UserModule } from '../shared/user';
import { FeedModule } from '../modules/feed';
import { SeriesModule } from '../modules/series';
import { ArticleListener } from './article';
import { ArticleModule } from '../modules/article';
import { SeriesListener } from './series';

@Module({
  imports: [
    PostModule,
    CommentModule,
    NotificationModule,
    FeedPublisherModule,
    MediaModule,
    UserModule,
    FeedModule,
    SeriesModule,
    ArticleModule,
  ],
  providers: [
    PostListener,
    CommentListener,
    ReactionListener,
    FollowListener,
    ArticleListener,
    SeriesListener,
  ],
})
export class ListenerModule {}
