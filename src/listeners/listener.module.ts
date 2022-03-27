import { PostModule } from '../modules/post';
import postListeners from './post';
import { Module } from '@nestjs/common';
import { LibModule } from '../app/lib.module';
import { NotificationModule } from '../notification';

@Module({
  imports: [LibModule, PostModule, NotificationModule],
  providers: [...postListeners],
})
export class ListenerModule {}
