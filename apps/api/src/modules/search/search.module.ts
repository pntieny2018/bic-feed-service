import { IKafkaConfig } from '@libs/infra/kafka';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaOptions, Transport } from '@nestjs/microservices';

import { PostModule } from '../post';
import { ReactionModule } from '../reaction';
import { TagModule } from '../tag';
import { GroupModuleV2 } from '../v2-group/group.module';
import { PostModuleV2 } from '../v2-post/post.module';
import { UserModuleV2 } from '../v2-user/user.module';

import { SearchConsumer } from './search.consumer';
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
  imports: [
    forwardRef(() => PostModuleV2),
    UserModuleV2,
    GroupModuleV2,
    PostModule,
    ReactionModule,
    TagModule,
  ],
  controllers: [SearchController, SearchConsumer],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
