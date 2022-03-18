import { MediaModule } from './../media/media.module';
import { UserModule } from './../../shared/user/user.module';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { IElasticsearchConfig } from 'src/config/elasticsearch';
import { GroupModule } from 'src/shared/group';
import { MentionModule } from '../mention';

@Module({
  imports: [
    DatabaseModule,
    ElasticsearchModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        const elasticsearchConfig = configService.get<IElasticsearchConfig>('elasticsearch');
        return {
          node: elasticsearchConfig.node,
          auth: {
            username: elasticsearchConfig.username,
            password: elasticsearchConfig.password,
          },
        };
      },
      inject: [ConfigService],
    }),
    UserModule,
    GroupModule,
    MediaModule,
    MentionModule,
  ],
  providers: [PostService],
  controllers: [PostController],
  exports: [PostService],
})
export class PostModule {}
