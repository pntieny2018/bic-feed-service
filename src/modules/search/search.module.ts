import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaOptions, Transport } from '@nestjs/microservices';
import { IKafkaConfig } from '../../config/kafka';
import { GroupModule } from '../../shared/group';
import { UserModule } from '../../shared/user';
import { PostModule } from '../post';
import { ReactionModule } from '../reaction';
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
  imports: [UserModule, GroupModule, PostModule, ReactionModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
