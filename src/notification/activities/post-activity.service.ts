import { PostResponseDto } from '../../modules/post/dto/responses';
import { ActivityObject, NotificationActivity } from '../dto/requests/notification-activity.dto';
import { ObjectHelper } from '../../common/helpers';
import { VerbActivity } from '../notification.constants';
import { Injectable } from '@nestjs/common';
import { ArticleResponseDto } from '../../modules/article/dto/responses';
import { SeriesResponseDto } from '../../modules/series/dto/responses';
import { ContentHelper } from './content.helper';

@Injectable()
export class PostActivityService {
  public createPayload(
    post: PostResponseDto | ArticleResponseDto | SeriesResponseDto
  ): NotificationActivity {
    const { title, media, mentions, content, targetType } = ContentHelper.getInfo(post);

    const activityObject: ActivityObject = {
      id: post.id,
      title: title,
      contentType: targetType.toLowerCase(),
      setting: post.setting as any,
      actor: ObjectHelper.omit(['groups', 'email'], post.actor) as any,
      audience: {
        groups: post.audience.groups.map((g) => ObjectHelper.omit(['child'], g)) as any,
      },
      mentions: mentions as any,
      content: content,
      media: media,
      reactionsCount: post.reactionsCount,
      createdAt: post.createdAt,
      updatedAt: post.createdAt,
    };

    return new NotificationActivity(
      activityObject,
      VerbActivity.POST,
      targetType,
      post.createdAt,
      post.updatedAt
    );
  }
}
