import { Inject } from '@nestjs/common';
import { v4 } from 'uuid';

import {
  CommentHasBeenCreated,
  CommentHasBeenDeleted,
  CommentHasBeenUpdated,
  KAFKA_TOPIC,
} from '../../../../common/constants';
import { ArticleDto, CommentBaseDto, PostDto } from '../../../v2-post/application/dto';
import { TargetType, VerbActivity } from '../../data-type';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../domain/infra-adapter-interface';
import {
  ActorObjectDto,
  CommentActivityObjectDto,
  CommentObjectDto,
  GroupObjectDto,
  NotificationActivityDto,
  NotificationPayloadDto,
} from '../dto';

import {
  ChildCommentCreatedNotificationPayload,
  ChildCommentUpdatedNotificationPayload,
  CommentCreatedNotificationPayload,
  CommentDeletedNotificationPayload,
  CommentUpdatedNotificationPayload,
  ICommentNotificationApplicationService,
} from './interface';

export class CommentNotificationApplicationService
  implements ICommentNotificationApplicationService
{
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async sendCommentCreatedNotification(
    payload: CommentCreatedNotificationPayload
  ): Promise<void> {
    const { actor, comment, content, commentRecipient, prevCommentActivities } = payload;

    const target = content instanceof PostDto ? TargetType.POST : TargetType.ARTICLE;
    const commentObject = this._createContentCommentActivityObject(content, comment);

    const activity = this._createCommentActivity(commentObject, target);

    const kafkaPayload = new NotificationPayloadDto<CommentActivityObjectDto>({
      key: content.id,
      value: {
        actor,
        event: CommentHasBeenCreated,
        data: activity,
        meta: {},
      },
    });

    kafkaPayload.value.meta.comment = kafkaPayload.value.meta.comment
      ? { ...kafkaPayload.value.meta.comment, commentRecipient }
      : { commentRecipient };

    if (prevCommentActivities.length) {
      kafkaPayload.value.meta.comment = kafkaPayload.value.meta.comment
        ? {
            ...kafkaPayload.value.meta.comment,
            prevCommentActivities: this._createPrevCommentActivities(
              prevCommentActivities,
              content
            ),
          }
        : {
            prevCommentActivities: this._createPrevCommentActivities(
              prevCommentActivities,
              content
            ),
          };
    }

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.COMMENT, kafkaPayload);
  }

  public async sendChildCommentCreatedNotification(
    payload: ChildCommentCreatedNotificationPayload
  ): Promise<void> {
    const { actor, comment, content, parentComment, replyCommentRecipient } = payload;

    const target = TargetType.COMMENT;
    const commentObject = this._createReplyCommentActivityObject(content, comment, parentComment);

    const activity = this._createCommentActivity(commentObject, target);

    const kafkaPayload = new NotificationPayloadDto<CommentActivityObjectDto>({
      key: content.id,
      value: {
        actor,
        event: CommentHasBeenCreated,
        data: activity,
        meta: {},
      },
    });

    kafkaPayload.value.meta.comment = kafkaPayload.value.meta.comment
      ? { ...kafkaPayload.value.meta.comment, replyCommentRecipient }
      : { replyCommentRecipient };

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.COMMENT, kafkaPayload);
  }

  public async sendCommentUpdatedNotification(
    payload: CommentUpdatedNotificationPayload
  ): Promise<void> {
    const { actor, comment, content, commentRecipient } = payload;

    const target = content instanceof PostDto ? TargetType.POST : TargetType.ARTICLE;
    const commentObject = this._createContentCommentActivityObject(content, comment);

    const activity = this._createCommentActivity(commentObject, target);

    const kafkaPayload = new NotificationPayloadDto<CommentActivityObjectDto>({
      key: content.id,
      value: {
        actor,
        event: CommentHasBeenUpdated,
        data: activity,
        meta: {},
      },
    });

    kafkaPayload.value.meta.comment = kafkaPayload.value.meta.comment
      ? { ...kafkaPayload.value.meta.comment, commentRecipient }
      : { commentRecipient };

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.COMMENT, kafkaPayload);
  }

  public async sendChildCommentUpdatedNotification(
    payload: ChildCommentUpdatedNotificationPayload
  ): Promise<void> {
    const { actor, comment, content, parentComment, replyCommentRecipient } = payload;

    const target = TargetType.COMMENT;
    const commentObject = this._createReplyCommentActivityObject(content, comment, parentComment);

    const activity = this._createCommentActivity(commentObject, target);

    const kafkaPayload = new NotificationPayloadDto<CommentActivityObjectDto>({
      key: content.id,
      value: {
        actor,
        event: CommentHasBeenUpdated,
        data: activity,
        meta: {},
      },
    });

    kafkaPayload.value.meta.comment = kafkaPayload.value.meta.comment
      ? { ...kafkaPayload.value.meta.comment, replyCommentRecipient }
      : { replyCommentRecipient };

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.COMMENT, kafkaPayload);
  }

  public async sendCommentDeletedNotification(
    payload: CommentDeletedNotificationPayload
  ): Promise<void> {
    const { actor, content, comment } = payload;

    const target = content instanceof PostDto ? TargetType.POST : TargetType.ARTICLE;
    const commentObject = this._createContentCommentActivityObject(content, comment);

    const activity = this._createCommentActivity(commentObject, target);

    const kafkaPayload = new NotificationPayloadDto<CommentActivityObjectDto>({
      key: content.id,
      value: {
        actor,
        event: CommentHasBeenDeleted,
        data: activity,
        meta: {},
      },
    });

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.COMMENT, kafkaPayload);
  }

  private _createContentCommentActivityObject(
    content: PostDto | ArticleDto,
    comment: CommentBaseDto
  ): CommentActivityObjectDto {
    return new CommentActivityObjectDto({
      id: content.id,
      actor: comment.actor,
      title: content instanceof ArticleDto ? content.title : null,
      contentType: content.type.toLowerCase(),
      setting: content.setting,
      audience: content.audience,
      content: content.content,
      mentions: content.mentions,
      comment: this._createCommentObject(comment),
      createdAt: comment.createdAt,
      updatedAt: comment.createdAt,
    });
  }

  private _createReplyCommentActivityObject(
    content: PostDto | ArticleDto,
    comment: CommentBaseDto,
    parentComment: CommentBaseDto
  ): CommentActivityObjectDto {
    return new CommentActivityObjectDto({
      id: content.id,
      actor: comment.actor,
      title: content instanceof ArticleDto ? content.title : null,
      contentType: content.type.toLowerCase(),
      setting: content.setting,
      audience: content.audience,
      content: content.content,
      mentions: content.mentions,
      comment: {
        ...this._createCommentObject(parentComment),
        child: this._createCommentObject(comment),
      },
      createdAt: comment.createdAt,
      updatedAt: comment.createdAt,
    });
  }

  private _createCommentObject(comment: CommentBaseDto): CommentObjectDto {
    return new CommentObjectDto({
      id: comment.id,
      actor: comment.actor,
      content: comment.content,
      media: comment.media,
      giphyId: comment.giphyId,
      giphyUrl: comment.giphyUrl,
      mentions: comment.mentions,
      createdAt: comment.createdAt,
      updatedAt: comment.createdAt,
    });
  }

  private _createCommentActivity(
    content: CommentActivityObjectDto,
    target: TargetType
  ): NotificationActivityDto<CommentActivityObjectDto> {
    return new NotificationActivityDto<CommentActivityObjectDto>({
      id: content.id,
      object: content,
      verb: VerbActivity.COMMENT,
      target: target,
      createdAt: content.createdAt,
    });
  }

  private _createPrevCommentActivities(
    comments: CommentBaseDto[],
    content: PostDto | ArticleDto
  ): NotificationActivityDto<CommentActivityObjectDto>[] {
    return comments.map((comment) => {
      const activity = new CommentActivityObjectDto({
        id: content.id,
        actor: new ActorObjectDto(content.actor),
        audience: {
          groups: content.audience.groups.map((group) => {
            return new GroupObjectDto(group);
          }),
        },
        title: (content as ArticleDto)?.title || '',
        contentType: content.type.toLowerCase(),
        content: content.content,
        setting: content.setting,
        mentions: content.mentions,
        comment: {
          id: comment.id,
          actor: comment.actor,
          content: comment.content,
          media: comment.media,
          giphyId: comment.giphyId,
          giphyUrl: comment.giphyUrl,
          mentions: comment.mentions as any,
          createdAt: comment.createdAt,
          updatedAt: comment.createdAt,
        },
        createdAt: content.createdAt,
        updatedAt: content.createdAt,
      });

      return new NotificationActivityDto<CommentActivityObjectDto>({
        id: v4(),
        object: activity,
        verb: VerbActivity.COMMENT,
        target: content.type as unknown as TargetType,
        createdAt: comment.createdAt,
      });
    });
  }
}
