import { HEADER_REQ_ID } from '@libs/common/constants';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, KafkaOptions, Transport } from '@nestjs/microservices';
import { ClsModule } from 'nestjs-cls';
import { v4 } from 'uuid';

import { SentryModule } from '../sentry';

import { IKafkaConfig, configs } from './config';
import { KAFKA_TOKEN } from './kafka.constant';
import { KafkaService } from './kafka.service';
import { KAFKA_SERVICE_TOKEN } from './kafka.service.interface';

@Module({
  imports: [
    SentryModule,
    ConfigModule.forRoot({
      cache: true,
      load: [configs],
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: false,
        saveReq: true,
        generateId: true,
        idGenerator: (req: Request) => {
          return req.headers[HEADER_REQ_ID] ?? v4();
        },
      },
    }),
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: KAFKA_TOKEN,
        inject: [ConfigService],
        useFactory: async (configService: ConfigService): Promise<KafkaOptions> => {
          const kafkaConfig = configService.get<IKafkaConfig>('kafka');
          return {
            transport: Transport.KAFKA,
            options: kafkaConfig,
          };
        },
      },
    ]),
  ],
  providers: [{ provide: KAFKA_SERVICE_TOKEN, useClass: KafkaService }],
  exports: [KAFKA_SERVICE_TOKEN],
})
export class KafkaModule {}
