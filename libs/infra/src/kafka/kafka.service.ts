import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ClsService } from 'nestjs-cls';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';
import { KAFKA_TOKEN, IKafkaConfig } from '@app/infra/kafka';

@Injectable()
export class KafkaService {
  private readonly _logger = new Logger(KafkaService.name);
  public constructor(
    @Inject(KAFKA_TOKEN) private readonly _kafkaClient: ClientKafka,
    private readonly _clsService: ClsService,
    private readonly _configService: ConfigService
  ) {}

  public emit<TInput>(topic: string, payload: TInput): void {
    const kafkaConfig = this._configService.get<IKafkaConfig>('kafka');
    const hasKey = payload.hasOwnProperty('key') && payload.hasOwnProperty('value');

    //const topicName = `${kafkaConfig.env}.${topic}`;
    const topicName = `${topic}`;
    const headers = {
      requestId: this._clsService.getId() ?? v4(),
    };
    const message = hasKey
      ? {
          key: payload['key'],
          value: JSON.stringify(payload['value']),
          headers,
        }
      : {
          value: JSON.stringify(payload),
          headers,
        };
    this._logger.debug(`Sent event[${topicName}]--- ${JSON.stringify(message)}`);
    this._kafkaClient.emit(topicName, message);
  }
}
