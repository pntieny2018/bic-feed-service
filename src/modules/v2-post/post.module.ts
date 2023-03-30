import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../database';
import { GroupModuleV2 } from '../v2-group/group.module';
import { TagController } from './driving-apdater/controller/tag.controller';
import { categoryProvider, tagProvider } from './provider';
import { UserModuleV2 } from '../v2-user/user.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IAxiosConfig } from '../../config/axios';
import { CategoryController } from './driving-apdater/controller/category.controller';
import { giphyProvider } from './provider/giphy.provider';
import { GiphyController } from './driving-apdater/controller/giphy.controller';

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
    GroupModuleV2,
    UserModuleV2,
  ],
  controllers: [TagController, CategoryController, GiphyController],
  providers: [...tagProvider, ...categoryProvider, ...giphyProvider],
})
export class PostModuleV2 {}
