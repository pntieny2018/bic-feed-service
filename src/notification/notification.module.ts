import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IKafkaConfig } from '../config/kafka';
import { DatabaseModule } from '../database';
import { PostModule } from '../modules/post';
import { CommentNotificationService } from './services';
import { ClientsModule } from '@nestjs/microservices';
import { CommentDissociationService } from './dissociations';
import { NotificationService } from './notification.service';
import { Transport } from '@nestjs/microservices/enums/transport.enum';
import { COMMENT_PRODUCER, POST_PRODUCER, REACTION_PRODUCER } from './producer.constants';
import { CommentActivityService, PostActivityService, ReactionActivityService } from './activities';
import { KafkaOptions } from '@nestjs/microservices/interfaces/microservice-configuration.interface';

export const register = async (config: ConfigService): Promise<KafkaOptions> => {
  const kafkaConfig = config.get<IKafkaConfig>('kafka');
  return {
    transport: Transport.KAFKA,
    options: kafkaConfig,
  };
};

@Module({
  imports: [
    forwardRef(() => PostModule),
    DatabaseModule,
    ClientsModule.registerAsync([
      {
        name: POST_PRODUCER,
        useFactory: register,
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [
    NotificationService,
    PostActivityService,
    ReactionActivityService,
    CommentActivityService,
    CommentDissociationService,
    CommentNotificationService,
  ],

  exports: [
    NotificationService,
    PostActivityService,
    ReactionActivityService,
    CommentActivityService,
    CommentDissociationService,
    CommentNotificationService,
  ],
})
export class NotificationModule {}
