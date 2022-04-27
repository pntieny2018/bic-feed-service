import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IKafkaConfig } from '../config/kafka';
import { CommentActivityService, PostActivityService, ReactionActivityService } from './activities';
import { ClientsModule } from '@nestjs/microservices';
import { CommentDissociationService } from './services';
import { NotificationService } from './notification.service';
import { Transport } from '@nestjs/microservices/enums/transport.enum';
import { COMMENT_PRODUCER, POST_PRODUCER, REACTION_PRODUCER } from './producer.constants';
import { KafkaOptions } from '@nestjs/microservices/interfaces/microservice-configuration.interface';

export const register = async (config: ConfigService): Promise<KafkaOptions> => {
  const kafkaConfig = config.get<IKafkaConfig>('kafka');
  return {
    transport: Transport.KAFKA,
    options: kafkaConfig,
  };
};

@Module({
  providers: [NotificationService],
  imports: [
    ClientsModule.registerAsync([
      {
        name: POST_PRODUCER,
        useFactory: register,
        inject: [ConfigService],
      },
      {
        name: COMMENT_PRODUCER,
        useFactory: register,
        inject: [ConfigService],
      },
      {
        name: REACTION_PRODUCER,
        useFactory: register,
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [
    NotificationService,
    PostActivityService,
    ReactionActivityService,
    CommentActivityService,
    CommentDissociationService,
  ],
})
export class NotificationModule {}
