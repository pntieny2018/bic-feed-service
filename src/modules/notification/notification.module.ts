import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ClientsModule } from '@nestjs/microservices';
import { COMMENT_PRODUCER, POST_PRODUCER, REACTION_PRODUCER } from './producer.constants';
import { ConfigService } from '@nestjs/config';
import { IKafkaConfig } from '../../config/kafka';
import { KafkaOptions } from '@nestjs/microservices/interfaces/microservice-configuration.interface';
import { Transport } from '@nestjs/microservices/enums/transport.enum';

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
  exports: [NotificationService],
})
export class NotificationModule {}
