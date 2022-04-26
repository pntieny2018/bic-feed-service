import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { NotificationPayloadDto } from './dto/requests/notification-payload.dto';
import { COMMENT_PRODUCER, POST_PRODUCER, REACTION_PRODUCER, TOPIC } from './producer.constants';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class NotificationService {
  private _logger = new Logger(NotificationService.name);

  public constructor(
    @Inject(POST_PRODUCER) private _postProducer: ClientKafka,
    @Inject(COMMENT_PRODUCER) private _commentProducer: ClientKafka,
    @Inject(REACTION_PRODUCER) private _reactionProducer: ClientKafka
  ) {}

  public publishPostNotification<T>(payload: NotificationPayloadDto<T>): any {
    return lastValueFrom(
      this._postProducer.emit(`${process.env.KAFKA_ENV}.${TOPIC.POST}`, payload)
    ).catch((ex) => this._logger.error(ex, ex.stack));
  }

  public publishCommentNotification<T>(payload: NotificationPayloadDto<T>): any {
    return lastValueFrom(
      this._commentProducer.emit(`${process.env.KAFKA_ENV}.${TOPIC.COMMENT}`, payload)
    ).catch((ex) => this._logger.error(ex, ex.stack));
  }

  public publishReactionNotification<T>(payload: NotificationPayloadDto<T>): any {
    return lastValueFrom(
      this._reactionProducer.emit(`${process.env.KAFKA_ENV}.${TOPIC.REACTION}`, payload)
    ).catch((ex) => this._logger.error(ex, ex.stack));
  }
}
