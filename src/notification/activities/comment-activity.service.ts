import { PostResponseDto } from '../../modules/post/dto/responses';
import { CommentResponseDto } from '../../modules/comment/dto/response';
import { ActivityObject, NotificationActivity } from '../dto/requests/notification-activity.dto';
import { ObjectHelper } from '../../common/helpers';
import { TypeActivity, VerbActivity } from '../notification.constants';
import { Injectable } from '@nestjs/common';
import { ArticleResponseDto } from '../../modules/article/dto/responses';
import { ContentHelper } from './content.helper';
import { SeriesResponseDto } from '../../modules/series/dto/responses';

@Injectable()
export class CommentActivityService {
  public createCommentPayload(
    post: PostResponseDto | ArticleResponseDto | SeriesResponseDto,
    comment: CommentResponseDto
  ): NotificationActivity {
    const { title, media, mentions, content, targetType } = ContentHelper.getInfo(post);

    const activityObject: ActivityObject = {
      id: post.id,
      actor: ObjectHelper.omit(['groups'], post.actor) as any,
      audience: {
        groups: post.audience.groups.map((g) => ObjectHelper.omit(['child'], g)) as any,
      },
      title: title,
      contentType: post.type.toLowerCase(),
      content: content,
      media: media,
      setting: post.setting as any,
      mentions: mentions as any,
      comment: {
        id: comment.id,
        actor: ObjectHelper.omit(['groups', 'email'], comment.actor) as any,
        content: comment.content,
        media: comment.media,
        giphyId: comment.giphyId,
        giphyUrl: comment.giphyUrl,
        mentions: comment.mentions as any,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
      createdAt: post.createdAt,
      updatedAt: post.createdAt,
    };

    return new NotificationActivity(
      activityObject,
      VerbActivity.COMMENT,
      targetType,
      comment.createdAt,
      comment.updatedAt
    );
  }

  public createReplyCommentPayload(
    post: PostResponseDto | ArticleResponseDto | SeriesResponseDto,
    comment: CommentResponseDto
  ): NotificationActivity {
    const parent = comment.parent;

    const { title, media, mentions, content } = ContentHelper.getInfo(post);

    const activityObject: ActivityObject = {
      id: post.id,
      title: title,
      actor: ObjectHelper.omit(['groups', 'email'], post.actor) as any,
      audience: {
        groups: post.audience.groups.map((g) => ObjectHelper.omit(['child'], g)) as any,
      },
      content: content,
      media: media,
      mentions: mentions as any,
      setting: post.setting as any,
      comment: {
        id: parent.id,
        actor: ObjectHelper.omit(['groups', 'email'], parent.actor) as any,
        content: parent.content,
        media: parent.media,
        mentions: parent.mentions as any,
        createdAt: parent.createdAt,
        updatedAt: parent.updatedAt,
        giphyId: parent.giphyId,
        giphyUrl: parent.giphyUrl,
        child: {
          id: comment.id,
          actor: ObjectHelper.omit(['groups', 'email'], comment.actor) as any,
          content: comment.content,
          media: comment.media,
          mentions: comment.mentions as any,
          giphyId: comment.giphyId,
          giphyUrl: comment.giphyUrl,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        },
      },
      createdAt: post.createdAt,
      updatedAt: post.createdAt,
    };

    return new NotificationActivity(
      activityObject,
      VerbActivity.COMMENT,
      TypeActivity.COMMENT,
      comment.createdAt,
      comment.createdAt
    );
  }
}
