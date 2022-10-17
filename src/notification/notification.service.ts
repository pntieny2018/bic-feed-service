import { ClientKafka } from '@nestjs/microservices';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { KAFKA_PRODUCER, KAFKA_TOPIC } from '../common/constants';
import { NotificationPayloadDto } from './dto/requests/notification-payload.dto';

@Injectable()
export class NotificationService {
  private readonly _logger = new Logger(NotificationService.name);

  public constructor(@Inject(KAFKA_PRODUCER) private _kafkaProducer: ClientKafka) {}

  public publishPostNotification<T>(payload: NotificationPayloadDto<T>): any {
    this._logger.debug(`[publishPostNotification]: ${payload.key}`);
    return this._kafkaProducer.emit(KAFKA_TOPIC.STREAM.POST, {
      key: payload.key,
      value: payload.value,
    });
  }

  public publishCommentNotification<T>(payload: NotificationPayloadDto<T>): any {
    this._logger.debug(`[publishCommentNotification]: ${payload.key}`);
    return this._kafkaProducer.emit(KAFKA_TOPIC.STREAM.COMMENT, {
      key: payload.key,
      value: payload.value,
    });
  }

  public publishReactionNotification<T>(payload: NotificationPayloadDto<T>): any {
    this._logger.debug(`[publishReactionNotification]: ${payload.key}`);
    return this._kafkaProducer.emit(KAFKA_TOPIC.STREAM.REACTION, {
      key: payload.key,
      value: payload.value,
    });
  }
}
