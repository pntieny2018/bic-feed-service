import postListeners from './post';
import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { IElasticsearchConfig } from 'src/config/elasticsearch';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
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
  ],
  providers: [...postListeners],
})
export class ListenerModule {}
