import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaOptions, Transport } from '@nestjs/microservices';
import { IKafkaConfig } from '../../config/kafka';
import { GroupModule } from '../../shared/group';
import { UserModule } from '../../shared/user';
import { PostModule } from '../post';
import { PostSearchService } from './search.service';
import { PostService } from './post.service';
import { SearchController } from './search.controller';
export const register = async (config: ConfigService): Promise<KafkaOptions> => {
  const kafkaConfig = config.get<IKafkaConfig>('kafka');
  return {
    transport: Transport.KAFKA,
    options: kafkaConfig,
  };
};
@Module({
  imports: [UserModule, GroupModule, PostModule],
  controllers: [SearchController],
  providers: [PostService, PostSearchService],
  exports: [PostService, PostSearchService],
})
export class SearchModule {}
