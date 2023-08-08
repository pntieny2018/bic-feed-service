import { ClientsModule, KafkaOptions, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SentryModule } from '@app/sentry';
import { Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { v4 } from 'uuid';
import { KafkaService, configs, KAFKA_TOKEN, IKafkaConfig } from '@app/infra/kafka';

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
          return (req.headers['x-ray-id'] || req.headers['x-request-id']) ?? v4();
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
