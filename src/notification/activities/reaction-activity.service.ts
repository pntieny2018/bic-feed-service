import { Injectable } from '@nestjs/common';
import { ObjectHelper } from '../../common/helpers';
import { ReactionResponseDto } from '../../modules/reaction/dto/response';
import { PostResponseDto } from '../../modules/post/dto/responses';
import { CommentResponseDto } from '../../modules/comment/dto/response';
import { TypeActivity, VerbActivity } from '../index';
import { ActivityObject, NotificationActivity } from '../dto/requests/notification-activity.dto';

@Injectable()
export class ReactionActivityService {
  protected createReactionPostPayload(
    post: PostResponseDto,
    reaction: ReactionResponseDto,
    action: string
  ): NotificationActivity {
    post.reactionsCount = post.reactionsCount ?? {};
    const reactionsMap = new Map<string, number>();
    const reactionsName = [];
    Object.values(post.reactionsCount ?? {}).forEach((r, index) => {
      const rn = Object.keys(r)[0];
      reactionsName.push(rn);
      reactionsMap.set(rn, index);
    });

    if (reactionsName.includes(reaction.reactionName)) {
      post.reactionsCount[reactionsMap.get(reaction.reactionName)][reaction.reactionName] =
        action === 'create'
          ? post.reactionsCount[reactionsMap.get(reaction.reactionName)][reaction.reactionName] + 1
          : post.reactionsCount[reactionsMap.get(reaction.reactionName)][reaction.reactionName] -
              1 <
            0
          ? 0
          : post.reactionsCount[reactionsMap.get(reaction.reactionName)][reaction.reactionName] + 1;
    } else {
      post.reactionsCount[reactionsMap.size] = {
        [reaction.reactionName]: 1,
      };
    }
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
    reaction: ReactionResponseDto,
    action: string
  ): NotificationActivity {
    comment.reactionsCount = comment.reactionsCount ?? {};
    const reactionsMap = new Map<string, number>();
    const reactionsName = [];
    Object.values(comment.reactionsCount ?? {}).forEach((r, index) => {
      const rn = Object.keys(r)[0];
      reactionsName.push(rn);
      reactionsMap.set(rn, index);
    });

    if (reactionsName.includes(reaction.reactionName)) {
      post.reactionsCount[reactionsMap.get(reaction.reactionName)][reaction.reactionName] =
        action === 'create'
          ? comment.reactionsCount[reactionsMap.get(reaction.reactionName)][reaction.reactionName] +
            1
          : comment.reactionsCount[reactionsMap.get(reaction.reactionName)][reaction.reactionName] -
              1 <
            0
          ? 0
          : comment.reactionsCount[reactionsMap.get(reaction.reactionName)][reaction.reactionName] -
            1;
    } else {
      comment.reactionsCount[reactionsMap.size] = {
        [reaction.reactionName]: 1,
      };
    }
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
    reaction: ReactionResponseDto,
    action = 'create'
  ): NotificationActivity {
    comment.reactionsCount = comment.reactionsCount ?? {};
    const reactionsMap = new Map<string, number>();
    const reactionsName = [];
    Object.values(comment.reactionsCount ?? {}).forEach((r, index) => {
      const rn = Object.keys(r)[0];
      reactionsName.push(rn);
      reactionsMap.set(rn, index);
    });

    if (reactionsName.includes(reaction.reactionName)) {
      post.reactionsCount[reactionsMap.get(reaction.reactionName)][reaction.reactionName] =
        action === 'create'
          ? comment.reactionsCount[reactionsMap.get(reaction.reactionName)][reaction.reactionName] +
            1
          : comment.reactionsCount[reactionsMap.get(reaction.reactionName)][reaction.reactionName] -
              1 <
            0
          ? 0
          : comment.reactionsCount[reactionsMap.get(reaction.reactionName)][reaction.reactionName] -
            1;
    } else {
      comment.reactionsCount[reactionsMap.size] = {
        [reaction.reactionName]: 1,
      };
    }
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
          reactionsCount: comment.reactionsCount,
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
    },
    action: 'create' | 'remove'
  ): NotificationActivity {
    if (type === TypeActivity.POST) {
      const { post, reaction } = data;
      return this.createReactionPostPayload(post, reaction, action);
    }

    if (type === TypeActivity.COMMENT) {
      const { post, comment, reaction } = data;
      return this.createReactionCommentPayload(post, comment, reaction, action);
    }

    if (type === TypeActivity.CHILD_COMMENT) {
      const { post, comment, reaction } = data;
      return this.createReactionChildCommentPayload(post, comment, reaction, action);
    }
    return null;
  }
}
