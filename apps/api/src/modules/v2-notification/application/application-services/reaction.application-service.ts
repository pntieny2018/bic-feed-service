import { Inject, Injectable } from '@nestjs/common';
import { v4, NIL } from 'uuid';

import { KAFKA_TOPIC } from '../../../../common/constants';
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

import { IReactionNotificationApplicationService, ReactionNotificationPayload } from './interface';

@Injectable()
export class ReactionNotificationApplicationService
  implements IReactionNotificationApplicationService
{
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async sendReactionNotification(payload: ReactionNotificationPayload): Promise<void> {
    const { event, actor, reaction, content, comment, parentComment } = payload;

    const activity = this._createReactionActivityObject(content, reaction, comment, parentComment);
    const target = !comment
      ? TargetType.POST
      : comment.parentId !== NIL
      ? TargetType.CHILD_COMMENT
      : TargetType.COMMENT;

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
          target,
          createdAt: reaction.createdAt,
        },
        meta: {},
      },
    };

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.REACTION, kafkaPayload);
  }

  private _createReactionActivityObject(
    content: PostDto | ArticleDto,
    reaction: ReactionDto,
    comment?: CommentExtendedDto,
    parentComment?: CommentExtendedDto
  ): ContentActivityObjectDto | CommentActivityObjectDto {
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

    if (!comment) {
      contentActivity.reaction = reaction;
      contentActivity.reactionsOfActor = content.ownerReactions;
      contentActivity.reactionsCount = content.reactionsCount;
      return contentActivity;
    } else if (comment && !parentComment) {
      return this._createCommentReactionActivityObject(reaction, contentActivity, comment);
    } else if (comment && parentComment) {
      return this._createReplyCommentReactionActivityObject(
        reaction,
        contentActivity,
        comment,
        parentComment
      );
    }
  }

  private _createCommentReactionActivityObject(
    reaction: ReactionDto,
    contentActivity: ContentActivityObjectDto,
    comment: CommentExtendedDto
  ): CommentActivityObjectDto {
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

  private _createReplyCommentReactionActivityObject(
    reaction: ReactionDto,
    contentActivity: ContentActivityObjectDto,
    comment: CommentExtendedDto,
    parentComment: CommentExtendedDto
  ): CommentActivityObjectDto {
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
