import { ActivityObject, NotificationActivity } from '../dto/requests/notification-activity.dto';
import { ObjectHelper } from '../../common/helpers';
import { TypeActivity, VerbActivity } from '../notification.constants';
import { SeriesResponseDto } from '../../modules/series/dto/responses';
import { ArticleResponseDto } from '../../modules/article/dto/responses';
import { IPost, PostType } from '../../database/models/post.model';

export class SeriesActivityService {
  public createAddedActivity(
    series: SeriesResponseDto,
    article: ArticleResponseDto
  ): NotificationActivity {
    const activityObject: ActivityObject = {
      id: series.id,
      title: series.title,
      contentType: series.type.toLowerCase(),
      setting: series.setting as any,
      actor: ObjectHelper.omit(['groups', 'email'], series.actor) as any,
      audience: {
        groups: series.audience.groups.map((g) => ObjectHelper.omit(['child'], g)) as any,
      },
      mentions: {},
      content: '',
      media: {
        videos: [],
        images: [],
        files: [],
      },
      article: {
        id: article.id,
        title: article.title,
        contentType: article.type.toLowerCase(),
        setting: article.setting as any,
        actor: ObjectHelper.omit(['groups', 'email'], article.actor) as any,
        audience: {
          groups: article.audience.groups.map((g) => ObjectHelper.omit(['child'], g)) as any,
        },
        mentions: {},
        content: article.content,
        media: article.media,
        createdAt: article.createdAt,
        updatedAt: article.createdAt,
      },
      createdAt: series.createdAt,
      updatedAt: series.createdAt,
    };

    return new NotificationActivity(
      activityObject,
      VerbActivity.ADD,
      TypeActivity.SERIES,
      new Date(),
      new Date()
    );
  }

  public getAddingItemToSeriesActivity(series: IPost, item: IPost): NotificationActivity {
    const activityObject = {
      id: series.id,
      title: series.title,
      contentType: series.type.toLowerCase(),
      actor: { id: series.createdBy },
      audience: {
        groups: series.groups.map((group) => ({ id: group.groupId })),
      },
      item: {
        id: item.id,
        title: item.title,
        contentType: item.type.toLowerCase(),
        actor: { id: item.createdBy },
        audience: {
          groups: item.groups.map((group) => ({ id: group.groupId })),
        },
        content: item.type === PostType.POST ? item.content : null,
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
      },
      createdAt: series.createdAt,
      updatedAt: series.createdAt,
    };

    return new NotificationActivity(
      activityObject,
      VerbActivity.ADD,
      TypeActivity.SERIES,
      new Date(),
      new Date()
    );
  }

  public getDeletingItemToSeriesActivity(series: IPost, item: IPost): NotificationActivity {
    const activityObject = {
      id: series.id,
      title: series.title,
      contentType: series.type.toLowerCase(),
      actor: { id: series.createdBy },
      audience: {
        groups: series.groups.map((group) => ({ id: group.groupId })),
      },
      item: {
        id: item.id,
        title: item.title,
        contentType: item.type.toLowerCase(),
        actor: { id: item.createdBy },
        audience: {
          groups: item.groups.map((group) => ({ id: group.groupId })),
        },
        content: item.type === PostType.POST ? item.content : null,
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
      },
      createdAt: series.createdAt,
      updatedAt: series.createdAt,
    };

    return new NotificationActivity(
      activityObject,
      VerbActivity.ADD,
      TypeActivity.SERIES,
      new Date(),
      new Date()
    );
  }
}
