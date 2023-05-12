import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../database';
import { GroupModuleV2 } from '../v2-group/group.module';
import { TagController } from './driving-apdater/controller/tag.controller';
import { categoryProvider, tagProvider, postProvider, commentProvider } from './provider';
import { UserModuleV2 } from '../v2-user/user.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IAxiosConfig } from '../../config/axios';
import { CategoryController } from './driving-apdater/controller/category.controller';
import { AuthorityModule } from '../authority';
import { PostController } from './driving-apdater/controller/post.controller';
import { CommentController } from './driving-apdater/controller/comment.controller';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const axiosConfig = configService.get<IAxiosConfig>('axios');
        return {
          baseURL: axiosConfig.baseUrl,
          maxRedirects: axiosConfig.maxRedirects,
          timeout: axiosConfig.timeout,
        };
      },
    }),
    CqrsModule,
    DatabaseModule,
    AuthorityModule,
    GroupModuleV2,
    UserModuleV2,
  ],
  controllers: [TagController, CategoryController, PostController, CommentController],
  providers: [...tagProvider, ...categoryProvider, ...postProvider, ...commentProvider],
})
export class PostModuleV2 {}
