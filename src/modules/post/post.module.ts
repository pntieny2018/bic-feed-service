import { MediaModule } from './../media/media.module';
import { MediaService } from './../media/media.service';
import { UserModule } from './../../shared/user/user.module';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { IElasticsearchConfig } from 'src/config/elasticsearch';
import { UserService } from 'src/shared/user';
import { GroupModule } from 'src/shared/group';

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
  ],
  providers: [PostService],
  controllers: [PostController],
  exports: [PostService],
})
export class PostModule {}
