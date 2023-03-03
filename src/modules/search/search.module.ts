import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaOptions, Transport } from '@nestjs/microservices';
import { IKafkaConfig } from '../../config/kafka';
import { GroupModule } from '../../shared/group';
import { PostModule } from '../post';
import { ReactionModule } from '../reaction';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { UserModuleV2 } from '../v2-user/user.module';
export const register = async (config: ConfigService): Promise<KafkaOptions> => {
  const kafkaConfig = config.get<IKafkaConfig>('kafka');
  return {
    transport: Transport.KAFKA,
    options: kafkaConfig,
  };
};
@Module({
  imports: [UserModuleV2, GroupModule, PostModule, ReactionModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
