import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../database';
import { GroupModuleV2 } from '../v2-group/group.module';
import { TagController } from './driving-apdater/controller/tag.controller';
import { categoryProvider, commentProvider, linkPreviewProvider, sharedProvider, tagProvider } from './provider';
import { UserModuleV2 } from '../v2-user/user.module';
import { CategoryController } from './driving-apdater/controller/category.controller';
import { AuthorityModule } from '../authority';
import { PostController } from './driving-apdater/controller/post.controller';
import { postProvider } from './provider/post.provider';
import { mediaProvider } from './provider/media.provider';
import { HttpModule } from '@nestjs/axios';
import { CommentController } from './driving-apdater/controller/comment.controller';

@Module({
  imports: [HttpModule, CqrsModule, DatabaseModule, AuthorityModule, GroupModuleV2, UserModuleV2],
  controllers: [TagController, CategoryController, PostController, CommentController],
  providers: [
    ...tagProvider,
    ...categoryProvider,
    ...postProvider,
    ...linkPreviewProvider,
    ...mediaProvider,
    ...commentProvider,
    ...sharedProvider,
  ],
})
export class PostModuleV2 {}
