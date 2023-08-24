import { SentryModule } from '@app/sentry';
import { HEADER_REQ_ID } from '@libs/common/constants';
import { KafkaService, configs, KAFKA_TOKEN, IKafkaConfig } from '@libs/infra/kafka';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, KafkaOptions, Transport } from '@nestjs/microservices';
import { ClsModule } from 'nestjs-cls';
import { v4 } from 'uuid';

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
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}