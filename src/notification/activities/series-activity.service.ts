import { ActivityObject, NotificationActivity } from '../dto/requests/notification-activity.dto';
import { ObjectHelper } from '../../common/helpers';
import { TypeActivity, VerbActivity } from '../notification.constants';
import { SeriesResponseDto } from '../../modules/series/dto/responses';
import { ArticleResponseDto } from '../../modules/article/dto/responses';
import { IPost, PostType } from '../../database/models/post.model';

export class SeriesActivityService {
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
        updatedAt: item.updatedAt,
      },
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
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
      VerbActivity.REMOVE,
      TypeActivity.SERIES,
      new Date(),
      new Date()
    );
  }
}
