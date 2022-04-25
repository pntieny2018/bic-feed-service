import { Injectable } from '@nestjs/common';
import { ObjectHelper } from '../../common/helpers';
import { ReactionResponseDto } from './dto/response';
import { PostResponseDto } from '../post/dto/responses';
import { CommentResponseDto } from '../comment/dto/response';
import { TypeActivity, VerbActivity } from '../../notification';
import {
  ActivityObject,
  NotificationActivity,
} from '../../notification/dto/requests/notification-activity.dto';

@Injectable()
export class ReactionNotificationService {
  protected createReactionPostPayload(
    post: PostResponseDto,
    reaction: ReactionResponseDto
  ): NotificationActivity {
    const activityObject: ActivityObject = {
      id: post.id,
      actor: ObjectHelper.omit(['groups', 'email'], post.actor) as any,
      audience: post.audience.groups.map((g) => ObjectHelper.omit(['child'], g)) as any,
      reaction: {
        id: reaction.id,
        createdAt: reaction.createdAt,
        reactionName: reaction.reactionName,
        actor: reaction.actor as any,
      },
      reactionsCount: post.reactionsCount,
      createdAt: post.createdAt,
      updatedAt: post.createdAt,
    };

    return new NotificationActivity(
      activityObject,
      VerbActivity.REACT,
      TypeActivity.POST,
      reaction.createdAt,
      reaction.createdAt
    );
  }

  protected createReactionCommentPayload(
    post: PostResponseDto,
    comment: CommentResponseDto,
    reaction: ReactionResponseDto
  ): NotificationActivity {
    const activityObject: ActivityObject = {
      id: post.id,
      actor: ObjectHelper.omit(['groups'], post.actor) as any,
      audience: post.audience.groups.map((g) => ObjectHelper.omit(['child'], g)) as any,
      comment: {
        id: comment.id,
        actor: ObjectHelper.omit(['groups'], comment.actor) as any,
        reaction: {
          id: reaction.id,
          reactionName: reaction.reactionName,
          actor: ObjectHelper.omit(['groups'], reaction.actor) as any,
          createdAt: reaction.createdAt,
        },
        content: comment.content,
        media: comment.media,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
      createdAt: post.createdAt,
      updatedAt: post.createdAt,
    };

    return new NotificationActivity(
      activityObject,
      VerbActivity.REACT,
      TypeActivity.COMMENT,
      reaction.createdAt,
      reaction.createdAt
    );
  }

  protected createReactionChildCommentPayload(
    post: PostResponseDto,
    comment: CommentResponseDto,
    reaction: ReactionResponseDto
  ): NotificationActivity {
    const parentComment = comment.parent;
    const activityObject: ActivityObject = {
      id: post.id,
      actor: ObjectHelper.omit(['groups'], post.actor) as any,
      audience: post.audience.groups.map((g) => ObjectHelper.omit(['child'], g)) as any,
      comment: {
        id: parentComment.id,
        actor: ObjectHelper.omit(['groups'], parentComment.actor) as any,
        content: parentComment.content,
        media: parentComment.media,
        createdAt: parentComment.createdAt,
        updatedAt: parentComment.updatedAt,
        child: {
          id: comment.id,
          actor: ObjectHelper.omit(['groups'], comment.actor) as any,
          reaction: {
            id: reaction.id,
            reactionName: reaction.reactionName,
            actor: ObjectHelper.omit(['groups'], reaction.actor) as any,
            createdAt: reaction.createdAt,
          },
          content: comment.content,
          media: comment.media,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        },
      },
      createdAt: post.createdAt,
      updatedAt: post.createdAt,
    };

    return new NotificationActivity(
      activityObject,
      VerbActivity.REACT,
      TypeActivity.CHILD_COMMENT,
      reaction.createdAt,
      reaction.createdAt
    );
  }

  public createPayload(
    type: TypeActivity,
    data: {
      reaction: ReactionResponseDto;
      post?: PostResponseDto;
      comment?: CommentResponseDto;
    }
  ): NotificationActivity {
    if (type === TypeActivity.POST) {
      const { post, reaction } = data;
      return this.createReactionPostPayload(post, reaction);
    }

    if (type === TypeActivity.COMMENT) {
      const { post, comment, reaction } = data;
      return this.createReactionCommentPayload(post, comment, reaction);
    }

    if (type === TypeActivity.CHILD_COMMENT) {
      const { post, comment, reaction } = data;
      return this.createReactionChildCommentPayload(post, comment, reaction);
    }
    return null;
  }
}
