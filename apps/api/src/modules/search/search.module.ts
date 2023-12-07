import { IKafkaConfig } from '@libs/infra/kafka/config';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaOptions, Transport } from '@nestjs/microservices';

import { PostModule } from '../post';
import { TagModule } from '../tag';
import { GroupModuleV2 } from '../v2-group/group.module';
import { PostModuleV2 } from '../v2-post/post.module';

import { SearchAppService } from './application/search.app-service';
import { ElasticsearchQueryBuilder } from './elasticsearch-query.builder';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

export const register = async (config: ConfigService): Promise<KafkaOptions> => {
  const kafkaConfig = config.get<IKafkaConfig>('kafka');
  return {
    transport: Transport.KAFKA,
    options: kafkaConfig,
  };
};
@Module({
  imports: [forwardRef(() => PostModuleV2), GroupModuleV2, PostModule, TagModule],
  controllers: [SearchController],
  providers: [SearchService, ElasticsearchQueryBuilder, SearchAppService],
  exports: [SearchService],
})
export class SearchModule {}
