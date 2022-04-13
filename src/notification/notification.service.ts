import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { NotificationPayloadDto } from './dto/requests/notification-payload.dto';
import { COMMENT_PRODUCER, POST_PRODUCER, REACTION_PRODUCER, TOPIC } from './producer.constants';

@Injectable()
export class NotificationService {
  public constructor(
    @Inject(POST_PRODUCER) private _postProducer: ClientKafka,
    @Inject(COMMENT_PRODUCER) private _commentProducer: ClientKafka,
    @Inject(REACTION_PRODUCER) private _reactionProducer: ClientKafka
  ) {}

  public publishPostNotification<T>(payload: NotificationPayloadDto<T>): any {
    console.log('topie=====', `${process.env.KAFKA_ENV + '.' + TOPIC.POST_NOTIFICATION}`);
    return this._postProducer.emit(
      `${process.env.KAFKA_ENV + '.' + TOPIC.POST_NOTIFICATION}`,
      payload
    );
  }

  public publishCommentNotification<T>(payload: NotificationPayloadDto<T>): any {
    return this._commentProducer.emit(
      `${process.env.KAFKA_ENV + '.' + TOPIC.COMMENT_NOTIFICATION}`,
      payload
    );
  }

  public publishReactionNotification<T>(payload: NotificationPayloadDto<T>): any {
    return this._reactionProducer.emit(
      `${process.env.KAFKA_ENV + '.' + TOPIC.REACTION_NOTIFICATION}`,
      payload
    );
  }
}
