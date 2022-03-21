import { Inject, Injectable } from '@nestjs/common';
import { COMMENT_PRODUCER, POST_PRODUCER, REACTION_PRODUCER, TOPIC } from './producer.constants';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class NotificationService {
  public constructor(
    @Inject(POST_PRODUCER) private _postProducer: ClientKafka,
    @Inject(COMMENT_PRODUCER) private _commentProducer: ClientKafka,
    @Inject(REACTION_PRODUCER) private _reactionProducer: ClientKafka
  ) {}

  public publishPostNotification<T>(payload: T): any {
    return this._postProducer.send(TOPIC.POST_NOTIFICATION, payload);
  }

  public publishCommentNotification<T>(payload: T): any {
    return this._postProducer.send(TOPIC.POST_NOTIFICATION, payload);
  }

  public publishReactionNotification<T>(payload: T): any {
    return this._postProducer.send(TOPIC.POST_NOTIFICATION, payload);
  }
}
