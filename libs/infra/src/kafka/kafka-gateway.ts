import { IKafkaConfig } from '@libs/infra/kafka';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaOptions, Transport } from '@nestjs/microservices';

export class KafkaGateway {
  /**
   * Initializers the kafka consumer.
   * Connects microservice to the NestApplication instance.
   * Transforms application to a hybrid instance.
   * @param app Reference instance of INestApplication.
   * @param configService Reference instance of ConfigService.
   * @return void
   */
  public static async init(
    app: INestApplication,
    configService: ConfigService
  ): Promise<INestApplication> {
    const defaultConfig = configService.get<IKafkaConfig>('kafka');
    app.connectMicroservice<KafkaOptions>({
      transport: Transport.KAFKA,
      options: defaultConfig,
    });
    return app.startAllMicroservices();
  }
}
