import { IKafkaService, KAFKA_SERVICE_TOKEN, KAFKA_TOPIC } from '@libs/infra/kafka';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { NotificationPayloadDto } from './dto/requests/notification-payload.dto';

@Injectable()
export class NotificationService {
  private readonly _logger = new Logger(NotificationService.name);

  public constructor(
    @Inject(KAFKA_SERVICE_TOKEN)
    private readonly _kafkaProducer: IKafkaService
  ) {}

  public async publishPostNotification<T>(payload: NotificationPayloadDto<T>): Promise<void> {
    this._logger.debug(`Sent event[${payload.value.event}]--- ${JSON.stringify(payload.value)}`);
    await this._kafkaProducer.emit(KAFKA_TOPIC.STREAM.POST, {
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
    this._logger.debug(`Sent event[${payload.value.event}]--- ${JSON.stringify(payload.value)}`);
    return this._kafkaProducer.emit(KAFKA_TOPIC.STREAM.REPORT, {
      key: payload.key,
      value: payload.value,
    });
  }
}
