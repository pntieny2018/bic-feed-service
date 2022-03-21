import { Inject, Injectable } from '@nestjs/common';
import { COMMENT_PRODUCER, POST_PRODUCER, REACTION_PRODUCER, TOPIC } from './producer.constants';
import { ClientKafka } from '@nestjs/microservices';
import { NotificationPayloadDto } from './dto/requests/notification-payload.dto';

@Injectable()
export class NotificationService {
  public constructor(
    @Inject(POST_PRODUCER) private _postProducer: ClientKafka,
    @Inject(COMMENT_PRODUCER) private _commentProducer: ClientKafka,
    @Inject(REACTION_PRODUCER) private _reactionProducer: ClientKafka
  ) {}

  public publishPostNotification<T>(payload: NotificationPayloadDto<T>): any {
    return this._postProducer.send(TOPIC.POST_NOTIFICATION, payload);
  }

  public publishCommentNotification<T>(payload: NotificationPayloadDto<T>): any {
    return this._postProducer.send(TOPIC.POST_NOTIFICATION, payload);
  }

  public publishReactionNotification<T>(payload: NotificationPayloadDto<T>): any {
    return this._postProducer.send(TOPIC.POST_NOTIFICATION, payload);
  }
}
