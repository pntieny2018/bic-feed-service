import { PostModule } from '../modules/post';
import postListeners from './post';
import { Module } from '@nestjs/common';
import { LibModule } from '../app/lib.module';
import { NotificationModule } from '../notification';
import { CommentListener } from './comment';

@Module({
  imports: [LibModule, PostModule, NotificationModule],
  providers: [...postListeners, CommentListener],
})
export class ListenerModule {}
