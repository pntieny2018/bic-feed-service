import { PostResponseDto } from '../../modules/post/dto/responses';
import { ActivityObject, NotificationActivity } from '../dto/requests/notification-activity.dto';
import { ObjectHelper } from '../../common/helpers';
import { TypeActivity, VerbActivity } from '../notification.constants';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PostActivityService {
  public createPayload(post: PostResponseDto): NotificationActivity {
    const activityObject: ActivityObject = {
      id: post.id,
      setting: post.setting as any,
      actor: ObjectHelper.omit(['groups', 'email'], post.actor) as any,
      audience: post.audience.groups.map((g) => ObjectHelper.omit(['child'], g)) as any,
      mentions: post.mentions as any,
      content: post.content,
      media: post.media,
      reactionsCount: post.reactionsCount,
      createdAt: post.createdAt,
      updatedAt: post.createdAt,
    };

    return new NotificationActivity(
      activityObject,
      VerbActivity.POST,
      TypeActivity.POST,
      post.createdAt,
      post.updatedAt
    );
  }
}
