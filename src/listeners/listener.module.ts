import postListeners from './post';
import { Module } from '@nestjs/common';
import { PostModule } from '../modules/post';

@Module({
  imports: [PostModule],
  providers: [...postListeners],
})
export class ListenerModule {}
