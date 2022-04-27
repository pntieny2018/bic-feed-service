import { PostResponseDto } from '../../modules/post/dto/responses';
import { CommentResponseDto } from '../../modules/comment/dto/response';
import { ActivityObject, NotificationActivity } from '../dto/requests/notification-activity.dto';
import { ObjectHelper } from '../../common/helpers';
import { TypeActivity, VerbActivity } from '../notification.constants';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CommentActivityService {
  public createCommentPayload(
    post: PostResponseDto,
    comment: CommentResponseDto
  ): NotificationActivity {
    const activityObject: ActivityObject = {
      id: post.id,
      actor: ObjectHelper.omit(['groups'], post.actor) as any,
      audience: post.audience.groups.map((g) => ObjectHelper.omit(['child'], g)) as any,
      comment: {
        id: comment.id,
        actor: ObjectHelper.omit(['groups'], comment.actor) as any,
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
      comment.createdAt,
      comment.updatedAt
    );
  }

  public createReplyCommentPayload(
    post: PostResponseDto,
    comment: CommentResponseDto
  ): NotificationActivity {
    const parent = comment.parent;

    const activityObject: ActivityObject = {
      id: post.id,
      actor: ObjectHelper.omit(['groups'], post.actor) as any,
      audience: post.audience.groups.map((g) => ObjectHelper.omit(['child'], g)) as any,
      comment: {
        id: parent.id,
        actor: ObjectHelper.omit(['groups'], parent.actor) as any,
        content: parent.content,
        media: parent.media,
        createdAt: parent.createdAt,
        updatedAt: parent.updatedAt,
        child: {
          id: comment.id,
          actor: ObjectHelper.omit(['groups'], comment.actor) as any,
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
      comment.createdAt,
      comment.createdAt
    );
  }
}
