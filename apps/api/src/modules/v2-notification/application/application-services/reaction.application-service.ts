import { KAFKA_TOPIC } from '@libs/infra/kafka';
import { Inject, Injectable } from '@nestjs/common';
import { v4 } from 'uuid';

import {
  ArticleDto,
  CommentExtendedDto,
  PostDto,
  ReactionDto,
} from '../../../v2-post/application/dto';
import { TargetType, VerbActivity } from '../../data-type';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../domain/infra-adapter-interface';
import {
  CommentActivityObjectDto,
  CommentObjectDto,
  ContentActivityObjectDto,
  NotificationPayloadDto,
} from '../dto';

import {
  IReactionNotificationApplicationService,
  ReactionCommentNotificationPayload,
  ReactionContentNotificationPayload,
  ReactionReplyCommentNotificationPayload,
} from './interface';

@Injectable()
export class ReactionNotificationApplicationService
  implements IReactionNotificationApplicationService
{
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async sendReactionContentNotification(
    payload: ReactionContentNotificationPayload
  ): Promise<void> {
    const { event, actor, reaction, content } = payload;

    const activity = this._createReactionContentActivityObject(content, reaction);

    const kafkaPayload: NotificationPayloadDto<
      ContentActivityObjectDto | CommentActivityObjectDto
    > = {
      key: content.id,
      value: {
        actor,
        event,
        data: {
          id: v4(),
          object: activity,
          verb: VerbActivity.REACT,
          target: TargetType.POST,
          createdAt: reaction.createdAt,
        },
        meta: {},
      },
    };

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.REACTION, kafkaPayload);
  }

  public async sendReactionCommentNotification(
    payload: ReactionCommentNotificationPayload
  ): Promise<void> {
    const { event, actor, reaction, content, comment } = payload;

    const activity = this._createReactionCommentActivityObject(content, reaction, comment);

    const kafkaPayload: NotificationPayloadDto<
      ContentActivityObjectDto | CommentActivityObjectDto
    > = {
      key: content.id,
      value: {
        actor,
        event,
        data: {
          id: v4(),
          object: activity,
          verb: VerbActivity.REACT,
          target: TargetType.COMMENT,
          createdAt: reaction.createdAt,
        },
        meta: {},
      },
    };

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.REACTION, kafkaPayload);
  }

  public async sendReactionReplyCommentNotification(
    payload: ReactionReplyCommentNotificationPayload
  ): Promise<void> {
    const { event, actor, reaction, content, comment, parentComment } = payload;

    const activity = this._createReactionReplyCommentActivityObject(
      content,
      reaction,
      comment,
      parentComment
    );

    const kafkaPayload: NotificationPayloadDto<
      ContentActivityObjectDto | CommentActivityObjectDto
    > = {
      key: content.id,
      value: {
        actor,
        event,
        data: {
          id: v4(),
          object: activity,
          verb: VerbActivity.REACT,
          target: TargetType.CHILD_COMMENT,
          createdAt: reaction.createdAt,
        },
        meta: {},
      },
    };

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.REACTION, kafkaPayload);
  }

  private _createReactionContentActivityObject(
    content: PostDto | ArticleDto,
    reaction: ReactionDto
  ): ContentActivityObjectDto {
    return new ContentActivityObjectDto({
      id: content.id,
      actor: content.actor,
      audience: content.audience,
      title: (content as ArticleDto)?.title || null,
      content: (content as PostDto)?.content || null,
      mentions: content.mentions,
      setting: content.setting,
      contentType: content.type,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      reaction,
      reactionsOfActor: content.ownerReactions,
      reactionsCount: content.reactionsCount,
    });
  }

  private _createReactionCommentActivityObject(
    content: PostDto | ArticleDto,
    reaction: ReactionDto,
    comment: CommentExtendedDto
  ): CommentActivityObjectDto {
    const contentActivity = new ContentActivityObjectDto({
      id: content.id,
      actor: content.actor,
      audience: content.audience,
      title: (content as ArticleDto)?.title || null,
      content: (content as PostDto)?.content || null,
      mentions: content.mentions,
      setting: content.setting,
      contentType: content.type,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    });

    const commentActivity = new CommentObjectDto({
      id: comment.id,
      actor: comment.actor,
      content: comment.content,
      media: comment.media,
      reaction,
      reactionsCount: comment.reactionsCount,
      reactionsOfActor: comment.ownerReactions,
      giphyId: comment.giphyId,
      giphyUrl: comment.giphyUrl,
      mentions: comment.mentions,
      createdAt: comment.createdAt,
      updatedAt: comment.createdAt,
    });

    return new CommentActivityObjectDto({
      ...contentActivity,
      comment: commentActivity,
    });
  }

  private _createReactionReplyCommentActivityObject(
    content: PostDto | ArticleDto,
    reaction: ReactionDto,
    comment: CommentExtendedDto,
    parentComment: CommentExtendedDto
  ): CommentActivityObjectDto {
    const contentActivity = new ContentActivityObjectDto({
      id: content.id,
      actor: content.actor,
      audience: content.audience,
      title: (content as ArticleDto)?.title || null,
      content: (content as PostDto)?.content || null,
      mentions: content.mentions,
      setting: content.setting,
      contentType: content.type,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    });

    const commentActivity = new CommentObjectDto({
      id: parentComment.id,
      actor: parentComment.actor,
      content: parentComment.content,
      media: parentComment.media,
      child: new CommentObjectDto({
        id: comment.id,
        actor: comment.actor,
        content: comment.content,
        media: comment.media,
        reaction,
        reactionsCount: comment.reactionsCount,
        reactionsOfActor: comment.ownerReactions,
        giphyId: comment.giphyId,
        giphyUrl: comment.giphyUrl,
        mentions: comment.mentions,
        createdAt: comment.createdAt,
        updatedAt: comment.createdAt,
      }),
      giphyId: parentComment.giphyId,
      giphyUrl: parentComment.giphyUrl,
      mentions: parentComment.mentions,
      createdAt: parentComment.createdAt,
      updatedAt: parentComment.createdAt,
    });

    return new CommentActivityObjectDto({
      ...contentActivity,
      comment: commentActivity,
    });
  }
}
