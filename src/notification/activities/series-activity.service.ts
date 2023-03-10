import { NotificationActivity } from '../dto/requests/notification-activity.dto';
import { TypeActivity, VerbActivity } from '../notification.constants';
import { IPost, PostType } from '../../database/models/post.model';
import { StringHelper } from '../../common/helpers';
import { ItemRemovedInSeriesEvent } from '../../events/series';

export class SeriesActivityService {
  public getDeletingSeriesActivity(series: IPost, items: IPost[]): NotificationActivity {
    const existingCreator = new Set([]);
    const filterItems = [];
    for (const item of items) {
      if (!existingCreator.has(item.createdBy)) {
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
          groups: item.groupIds,
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
}
