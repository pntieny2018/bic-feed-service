import { ClientKafka } from '@nestjs/microservices';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { KAFKA_PRODUCER, KAFKA_TOPIC } from '../common/constants';
import { NotificationPayloadDto } from './dto/requests/notification-payload.dto';

@Injectable()
export class NotificationService {
  private readonly _logger = new Logger(NotificationService.name);

  public constructor(@Inject(KAFKA_PRODUCER) private _kafkaProducer: ClientKafka) {}

  public async publishPostNotification<T>(payload: NotificationPayloadDto<T>): Promise<void> {
    await this._kafkaProducer.emit(KAFKA_TOPIC.STREAM.POST, {
      key: payload.key,
      value: payload.value,
    });
  }

  public publishCommentNotification<T>(payload: NotificationPayloadDto<T>): any {
    return this._kafkaProducer.emit(KAFKA_TOPIC.STREAM.COMMENT, {
      key: payload.key,
      value: payload.value,
    });
  }

  public publishReactionNotification<T>(payload: NotificationPayloadDto<T>): any {
    return this._kafkaProducer.emit(KAFKA_TOPIC.STREAM.REACTION, {
      key: payload.key,
      value: payload.value,
    });
  }

  public publishReportNotification<T>(payload: NotificationPayloadDto<T>): any {
    return this._kafkaProducer.emit(KAFKA_TOPIC.STREAM.REPORT, {
      key: payload.key,
      value: payload.value,
    });
  }
}
