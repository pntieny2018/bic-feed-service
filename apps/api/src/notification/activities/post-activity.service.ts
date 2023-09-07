import {
  ActivityObject,
  ActorObject,
  AudienceObject,
  MediaObject,
  MentionObject,
  NotificationActivity,
  SettingObject,
} from '../dto/requests/notification-activity.dto';
import { VerbActivity } from '../notification.constants';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PostActivityService {
  public createPayload(post: {
    id: string;
    title: string;
    content: string;
    contentType: string;
    setting: SettingObject;
    audience: AudienceObject;
    actor: ActorObject;
    createdAt: Date;
    mentions?: MentionObject;
    media?: MediaObject;
    cover?: string;
    summary?: string;
  }): NotificationActivity {
    const {
      title,
      content,
      contentType,
      setting,
      audience,
      actor,
      mentions,
      createdAt,
      media,
      cover,
      summary,
    } = post;

    const activityObject: ActivityObject = {
      id: post.id,
      title,
      contentType: contentType.toLowerCase(),
      setting,
      actor,
      audience,
      mentions: mentions as any,
      content,
      media,
      createdAt,
      cover,
      summary,
      // reactionsCount: post.reactionsCount,
      // updatedAt: post.createdAt,
    };

    return new NotificationActivity(
      activityObject,
      VerbActivity.POST,
      contentType as any,
      post.createdAt,
      post.createdAt
    );
  }
}
