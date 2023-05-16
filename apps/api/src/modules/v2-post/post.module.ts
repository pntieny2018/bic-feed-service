import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../database';
import { GroupModuleV2 } from '../v2-group/group.module';
import { TagController } from './driving-apdater/controller/tag.controller';
import { categoryProvider, linkPreviewProvider, tagProvider } from './provider';
import { UserModuleV2 } from '../v2-user/user.module';
import { CategoryController } from './driving-apdater/controller/category.controller';
import { AuthorityModule } from '../authority';
import { PostController } from './driving-apdater/controller/post.controller';
import { postProvider } from './provider/post.provider';
import { mediaProvider } from './provider/media.provider';

@Module({
  imports: [CqrsModule, DatabaseModule, AuthorityModule, GroupModuleV2, UserModuleV2],
  controllers: [TagController, CategoryController, PostController],
  providers: [
    ...tagProvider,
    ...categoryProvider,
    ...postProvider,
    ...linkPreviewProvider,
    ...mediaProvider,
  ],
})
export class PostModuleV2 {}
