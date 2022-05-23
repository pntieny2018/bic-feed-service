import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { NotificationPayloadDto } from './dto/requests/notification-payload.dto';
import { POST_PRODUCER, TOPIC } from './producer.constants';
import { CompressionTypes } from '@nestjs/microservices/external/kafka.interface';

@Injectable()
export class NotificationService implements OnModuleInit {
  private _logger = new Logger(NotificationService.name);

  public constructor(@Inject(POST_PRODUCER) private _postProducer: ClientKafka) {}

  public publishPostNotification<T>(payload: NotificationPayloadDto<T>): any {
    return this._postProducer['producer'].send({
      topic: `${process.env.KAFKA_ENV}.${TOPIC.POST}`,
      messages: [
        {
          key: payload.key,
          value: JSON.stringify(payload.value),
        },
      ],
      acks: 1,
      compression: CompressionTypes.None,
    });
    // return lastValueFrom(
    //   this._postProducer.emit(`${process.env.KAFKA_ENV}.${TOPIC.POST}`, payload)
    // ).catch((ex) => this._logger.error(ex, ex.stack));
  }

  public publishCommentNotification<T>(payload: NotificationPayloadDto<T>): any {
    return this._postProducer['producer'].send({
      topic: `${process.env.KAFKA_ENV}.${TOPIC.COMMENT}`,
      messages: [
        {
          key: payload.key,
          value: JSON.stringify(payload.value),
        },
      ],
      acks: 1,
      compression: CompressionTypes.None,
    });
    // return lastValueFrom(
    //   this._commentProducer.emit(`${process.env.KAFKA_ENV}.${TOPIC.COMMENT}`, payload)
    // ).catch((ex) => this._logger.error(ex, ex.stack));
  }

  public publishReactionNotification<T>(payload: NotificationPayloadDto<T>): any {
    return this._postProducer['producer'].send({
      topic: `${process.env.KAFKA_ENV}.${TOPIC.REACTION}`,
      messages: [
        {
          key: payload.key,
          value: JSON.stringify(payload.value),
        },
      ],
      acks: 1,
      compression: CompressionTypes.None,
    });
    // return lastValueFrom(
    //   this._reactionProducer.emit(`${process.env.KAFKA_ENV}.${TOPIC.REACTION}`, payload)
    // ).catch((ex) => this._logger.error(ex, ex.stack));
  }

  public async onModuleInit(): Promise<any> {
    await this._postProducer.connect();
    await this._commentProducer.connect();
    await this._reactionProducer.connect();
  }
}
