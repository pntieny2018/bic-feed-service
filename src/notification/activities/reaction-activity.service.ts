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
          : post.reactionsCount[reactionsMap.get(reaction.reactionName)][reaction.reactionName] - 1;
    } else {
      post.reactionsCount[reactionsMap.size] = {
        [reaction.reactionName]: action === 'create' ? 1 : 0,
      };
    }
    const reactionObject = {
      id: reaction.id,
      createdAt: reaction.createdAt,
      reactionName: reaction.reactionName,
      actor: reaction.actor as any,
    };

    let ownerReactions = post.ownerReactions.map((or) => ({
      id: or.id,
      reactionName: or.reactionName,
      createdAt: or.createdAt,
      actor: reactionObject.actor,
    }));

    if (action === 'create') {
      ownerReactions.push(reactionObject);
    } else {
      ownerReactions = ownerReactions.filter((or) => or.id !== reaction.id);
    }

    const activityObject: ActivityObject = {
      id: post.id,
      actor: ObjectHelper.omit(['groups', 'email'], post.actor) as any,
      audience: {
        groups: post.audience.groups.map((g) => ObjectHelper.omit(['child'], g)) as any,
      },
      content: post.content,
      media: post.media,
      mentions: post.mentions as any,
      setting: post.setting as any,
      reaction: reactionObject,
      reactionsOfActor: ownerReactions,
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
      comment.reactionsCount[reactionsMap.get(reaction.reactionName)][reaction.reactionName] =
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
        [reaction.reactionName]: action === 'create' ? 1 : 0,
      };
    }

    const reactionObject = {
      id: reaction.id,
      reactionName: reaction.reactionName,
      actor: ObjectHelper.omit(['groups', 'email'], reaction.actor) as any,
      createdAt: reaction.createdAt,
    };

    let ownerReactions = comment.ownerReactions.map((or) => ({
      id: or.id,
      reactionName: or.reactionName,
      createdAt: or.createdAt,
      actor: reactionObject.actor,
    }));

    if (action === 'create') {
      ownerReactions.push(reactionObject);
    } else {
      ownerReactions = ownerReactions.filter((or) => or.id !== reaction.id);
    }

    const activityObject: ActivityObject = {
      id: post.id,
      actor: ObjectHelper.omit(['groups', 'email'], post.actor) as any,
      audience: {
        groups: post.audience.groups.map((g) => ObjectHelper.omit(['child'], g)) as any,
      },
      content: post.content,
      media: post.media,
      mentions: post.mentions as any,
      setting: post.setting as any,
      comment: {
        id: comment.id,
        actor: ObjectHelper.omit(['groups', 'email'], comment.actor) as any,
        reaction: reactionObject,
        content: comment.content,
        media: comment.media,
        mentions: comment.mentions as any,
        reactionsCount: comment.reactionsCount,
        reactionsOfActor: ownerReactions,
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
      comment.reactionsCount[reactionsMap.get(reaction.reactionName)][reaction.reactionName] =
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
        [reaction.reactionName]: action === 'create' ? 1 : 0,
      };
    }
    const parentComment = comment.parent;

    const reactionObject = {
      id: reaction.id,
      reactionName: reaction.reactionName,
      actor: ObjectHelper.omit(['groups', 'email'], reaction.actor) as any,
      createdAt: reaction.createdAt,
    };

    let ownerReactions = comment.ownerReactions.map((or) => ({
      id: or.id,
      reactionName: or.reactionName,
      createdAt: or.createdAt,
      actor: reactionObject.actor,
    }));

    if (action === 'create') {
      ownerReactions.push(reactionObject);
    } else {
      ownerReactions = ownerReactions.filter((or) => or.id !== reaction.id);
    }

    const activityObject: ActivityObject = {
      id: post.id,
      actor: ObjectHelper.omit(['groups', 'email'], post.actor) as any,
      audience: {
        groups: post.audience.groups.map((g) => ObjectHelper.omit(['child'], g)) as any,
      },
      content: post.content,
      media: post.media,
      setting: post.setting as any,
      mentions: post.mentions as any,
      comment: {
        id: parentComment.id,
        actor: ObjectHelper.omit(['groups', 'email'], parentComment.actor) as any,
        content: parentComment.content,
        media: parentComment.media,
        mentions: parentComment.mentions as any,
        createdAt: parentComment.createdAt,
        updatedAt: parentComment.updatedAt,
        child: {
          id: comment.id,
          actor: ObjectHelper.omit(['groups', 'email'], comment.actor) as any,
          reaction: reactionObject,
          reactionsCount: comment.reactionsCount,
          reactionsOfActor: ownerReactions,
          content: comment.content,
          media: comment.media,
          mentions: comment.mentions as any,
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
