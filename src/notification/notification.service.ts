import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { NotificationPayloadDto } from './dto/requests/notification-payload.dto';
import { CompressionTypes } from '@nestjs/microservices/external/kafka.interface';
import { KAFKA_PRODUCER, KAFKA_TOPIC } from '../common/constants';

@Injectable()
export class NotificationService {
  private _logger = new Logger(NotificationService.name);

  public constructor(@Inject(KAFKA_PRODUCER) private _kafkaProducer: ClientKafka) {}

  public publishPostNotification<T>(payload: NotificationPayloadDto<T>): any {
    return this._kafkaProducer[KAFKA_PRODUCER].send({
      topic: KAFKA_TOPIC.STREAM.POST,
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
    return this._kafkaProducer[KAFKA_PRODUCER].send({
      topic: KAFKA_TOPIC.STREAM.COMMENT,
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
    console.log(JSON.stringify(payload.value.event));
    return this._kafkaProducer[KAFKA_PRODUCER].send({
      topic: KAFKA_TOPIC.STREAM.REACTION,
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
}
