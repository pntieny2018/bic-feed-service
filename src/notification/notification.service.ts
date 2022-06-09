import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { NotificationPayloadDto } from './dto/requests/notification-payload.dto';
import { KAFKA_PRODUCER, KAFKA_TOPIC } from '../common/constants';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly _logger = new Logger(NotificationService.name);

  public constructor(@Inject(KAFKA_PRODUCER) private _kafkaProducer: ClientKafka) {}

  public publishPostNotification<T>(payload: NotificationPayloadDto<T>): any {
    this._logger.debug(`[publishPostNotification]: ${payload.key}`);
    return this._kafkaProducer['producer'].send({
      topic: KAFKA_TOPIC.STREAM.POST,
      messages: [
        {
          key: payload.key,
          value: JSON.stringify(payload.value),
        },
      ],
    });
  }

  public publishCommentNotification<T>(payload: NotificationPayloadDto<T>): any {
    this._logger.debug(`[publishCommentNotification]: ${payload.key}`);
    return this._kafkaProducer['producer'].send({
      topic: KAFKA_TOPIC.STREAM.COMMENT,
      messages: [
        {
          key: payload.key,
          value: JSON.stringify(payload.value),
        },
      ],
    });
  }

  public publishReactionNotification<T>(payload: NotificationPayloadDto<T>): any {
    this._logger.debug(`[publishReactionNotification]: ${payload.key}`);
    return this._kafkaProducer['producer'].send({
      topic: KAFKA_TOPIC.STREAM.REACTION,
      messages: [{ key: payload.key, value: JSON.stringify(payload.value) }],
    });
  }

  public async onModuleInit(): Promise<void> {
    // await this._kafkaProducer.connect();
  }
}
