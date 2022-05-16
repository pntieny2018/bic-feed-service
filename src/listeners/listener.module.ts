import { PostListener } from './post';
import { Module } from '@nestjs/common';
import { CommentListener } from './comment';
import { PostModule } from '../modules/post';
import { ReactionListener } from './reaction';
import { NotificationModule } from '../notification';
import { FeedPublisherModule } from '../modules/feed-publisher';
import { CommentModule } from '../modules/comment';
import { MediaModule } from '../modules/media';

@Module({
  imports: [PostModule, CommentModule, NotificationModule, FeedPublisherModule, MediaModule],
  providers: [PostListener, CommentListener, ReactionListener],
})
export class ListenerModule {}
