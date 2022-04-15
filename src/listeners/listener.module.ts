import { CommentModule } from './../modules/comment/comment.module';
import { PostListener } from './post';
import { Module } from '@nestjs/common';
import { CommentListener } from './comment';
import { PostModule } from '../modules/post';
import { LibModule } from '../app/lib.module';
import { ReactionListener } from './reaction';
import { NotificationModule } from '../notification';
import { FeedPublisherModule } from '../modules/feed-publisher';

@Module({
  imports: [LibModule, PostModule, CommentModule, NotificationModule, FeedPublisherModule],
  providers: [PostListener, CommentListener, ReactionListener],
})
export class ListenerModule {}
