import { MediaModule } from '../media';
import { UserModule } from '../../shared/user';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { IElasticsearchConfig } from 'src/config/elasticsearch';
import { GroupModule } from 'src/shared/group';
import { MentionModule } from '../mention';
import { PostPolicyService } from './post-policy.service';

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
  providers: [PostService, PostPolicyService],
  controllers: [PostController, PostPolicyService],
})
export class PostModule {}
