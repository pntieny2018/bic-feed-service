import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaOptions, Transport } from '@nestjs/microservices';
import { IKafkaConfig } from '../../config/kafka';
import { PostModule } from '../post';
import { ReactionModule } from '../reaction';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { UserModuleV2 } from '../v2-user/user.module';
import { GroupModuleV2 } from '../v2-group/group.module';

export const register = async (config: ConfigService): Promise<KafkaOptions> => {
  const kafkaConfig = config.get<IKafkaConfig>('kafka');
  return {
    transport: Transport.KAFKA,
    options: kafkaConfig,
  };
};
@Module({
  imports: [UserModuleV2, GroupModuleV2, PostModule, ReactionModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
