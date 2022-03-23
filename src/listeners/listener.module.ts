import { PostModule } from '../modules/post';
import postListeners from './post';
import { Module } from '@nestjs/common';
import { LibModule } from '../app/lib.module';

@Module({
  imports: [LibModule, PostModule],
  providers: [...postListeners],
})
export class ListenerModule {}
