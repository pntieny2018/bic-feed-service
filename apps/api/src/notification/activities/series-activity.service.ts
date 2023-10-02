import { AudienceObject, NotificationActivity } from '../dto/requests/notification-activity.dto';
import { TypeActivity, VerbActivity } from '../notification.constants';
import { IPost, PostType } from '../../database/models/post.model';
import { StringHelper } from '../../common/helpers';
import { ItemRemovedInSeriesEvent } from '../../events/series';

export class SeriesActivityService {
  public getDeletingSeriesActivity(series: IPost, items: IPost[]): NotificationActivity {
    const existingCreator = new Set([]);
    const filterItems = [];
    for (const item of items) {
      if (!existingCreator.has(item.createdBy) && item.createdBy !== series.createdBy) {
        filterItems.push({
          id: item.id,
          title: item.title,
          contentType: item.type.toLowerCase(),
          actor: { id: item.createdBy },
          audience: {
            groups: item.groups.map((group) => ({ id: group.groupId })),
          },
          content:
            item.type === PostType.POST ? StringHelper.removeMarkdownCharacter(item.content) : null,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
        existingCreator.add(item.createdBy);
      }
    }
    const activityObject = {
      id: series.id,
      title: series.title,
      contentType: series.type.toLowerCase(),
      actor: { id: series.createdBy },
      audience: {
        groups: series.groups.map((group) => ({ id: group.groupId })),
      },
      items: filterItems,
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
    };

    return new NotificationActivity(
      activityObject,
      VerbActivity.DELETE,
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
        content:
          item.type === PostType.POST ? StringHelper.removeMarkdownCharacter(item.content) : null,
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

  public getDeletingItemToSeriesActivity(
    series: IPost,
    item: ItemRemovedInSeriesEvent
  ): NotificationActivity {
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
          groups: (item.groupIds || []).map((groupId) => ({ id: groupId })),
        },
        content:
          item.type === PostType.POST ? StringHelper.removeMarkdownCharacter(item.content) : null,
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

  public getChangeSeriesActivity(content: IPost, series: ISeriesState[]): NotificationActivity {
    const activityObject = {
      id: content.id,
      title: content.title,
      content: content.content,
      contentType: content.type.toLowerCase(),
      actor: { id: content.createdBy },
      items: series,
      createdAt: content.createdAt,
      updatedAt: content.createdAt,
    };

    return new NotificationActivity(
      activityObject,
      VerbActivity.CHANGE,
      TypeActivity.SERIES,
      new Date(),
      new Date()
    );
  }
}

export interface ISeriesState {
  actor: {
    id: string;
  };
  id: string;
  title: string;
  state: 'add' | 'remove';
  audience?: AudienceObject;
}
