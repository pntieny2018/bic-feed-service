import { Inject } from '@nestjs/common';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { ArticleDto, CommentDto, PostDto } from '../../../v2-post/application/dto';
import { TargetType, VerbActivity } from '../../data-type';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../domain/infra-adapter-interface';
import {
  CommentActivityObjectDto,
  CommentObjectDto,
  NotificationActivityDto,
  NotificationPayloadDto,
} from '../dto';

import { CommentNotificationPayload, ICommentNotificationApplicationService } from './interface';

export class CommentNotificationApplicationService
  implements ICommentNotificationApplicationService
{
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async sendCommentNotification(payload: CommentNotificationPayload): Promise<void> {
    const {
      event,
      actor,
      comment,
      content,
      parentComment,
      commentRecipient,
      replyCommentRecipient,
      prevCommentActivities,
    } = payload;

    let commentObject;
    let target;

    if (parentComment) {
      target = TargetType.COMMENT;
      commentObject = this._createReplyCommentActivityObject(content, comment, parentComment);
    } else {
      target = content instanceof PostDto ? TargetType.POST : TargetType.ARTICLE;
      commentObject = this._createContentCommentActivityObject(content, comment);
    }

    const activity = this._createCommentActivity(commentObject, target);

    const kafkaPayload: NotificationPayloadDto<CommentActivityObjectDto> = {
      key: content.id,
      value: {
        actor,
        event,
        data: activity,
        meta: {},
      },
    };
    if (commentRecipient) {
      kafkaPayload.value.meta.comment = kafkaPayload.value.meta.comment
        ? { ...kafkaPayload.value.meta.comment, commentRecipient }
        : { commentRecipient };
    }
    if (replyCommentRecipient) {
      kafkaPayload.value.meta.comment = kafkaPayload.value.meta.comment
        ? { ...kafkaPayload.value.meta.comment, replyCommentRecipient }
        : { replyCommentRecipient };
    }
    if (prevCommentActivities?.length) {
      kafkaPayload.value.meta.comment = kafkaPayload.value.meta.comment
        ? { ...kafkaPayload.value.meta.comment, prevCommentActivities }
        : { prevCommentActivities };
    }

    await this._kafkaAdapter.emit<NotificationPayloadDto<CommentActivityObjectDto>>(
      KAFKA_TOPIC.STREAM.POST,
      kafkaPayload
    );
  }

  private _createContentCommentActivityObject(
    content: PostDto | ArticleDto,
    comment: CommentDto
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
    comment: CommentDto,
    parentComment: CommentDto
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

  private _createCommentObject(comment: CommentDto): CommentObjectDto {
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
      updatedAt: content.updatedAt,
    });
  }
}
