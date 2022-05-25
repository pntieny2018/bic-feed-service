import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { NotificationPayloadDto } from './dto/requests/notification-payload.dto';
import { KAFKA_PRODUCER, KAFKA_TOPIC } from '../common/constants';

@Injectable()
export class NotificationService {
  public constructor(@Inject(KAFKA_PRODUCER) private _kafkaProducer: ClientKafka) {}

  public publishPostNotification<T>(payload: NotificationPayloadDto<T>): any {
    return this._kafkaProducer.emit(KAFKA_TOPIC.STREAM.POST, {
      key: payload.key,
      value: JSON.stringify(payload.value),
    });
  }

  public publishCommentNotification<T>(payload: NotificationPayloadDto<T>): any {
    return this._kafkaProducer.emit(KAFKA_TOPIC.STREAM.COMMENT, {
      key: payload.key,
      value: JSON.stringify(payload.value),
    });
  }

  public publishReactionNotification<T>(payload: NotificationPayloadDto<T>): any {
    return this._kafkaProducer.emit(KAFKA_TOPIC.STREAM.REACTION, {
      key: payload.key,
      value: JSON.stringify(payload.value),
    });
  }

  public async onModuleInit(): Promise<any> {
    await this._kafkaProducer.connect();
  }
}
