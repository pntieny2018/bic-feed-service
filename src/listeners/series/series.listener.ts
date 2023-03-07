import { SentryService } from '@app/sentry';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { FeedService } from 'src/modules/feed/feed.service';
import { On } from '../../common/decorators';
import { MediaType } from '../../database/models/media.model';
import { PostStatus, PostType } from '../../database/models/post.model';
import {
  SeriesHasBeenDeletedEvent,
  SeriesHasBeenPublishedEvent,
  SeriesHasBeenUpdatedEvent,
} from '../../events/series';
import { FeedPublisherService } from '../../modules/feed-publisher';
import { PostHistoryService } from '../../modules/post/post-history.service';
import { SearchService } from '../../modules/search/search.service';
import { PostActivityService } from '../../notification/activities';
import { NotificationService } from '../../notification';
import { ArrayHelper } from '../../common/helpers';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../modules/v2-group/application';

@Injectable()
export class SeriesListener {
  private _logger = new Logger(SeriesListener.name);

  public constructor(
    private readonly _feedPublisherService: FeedPublisherService,
    private readonly _sentryService: SentryService,
    private readonly _postServiceHistory: PostHistoryService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    private readonly _postSearchService: SearchService,
    private readonly _feedService: FeedService,
    private readonly _postActivityService: PostActivityService,
    private readonly _notificationService: NotificationService
  ) {}

  @On(SeriesHasBeenDeletedEvent)
  public async onSeriesDeleted(event: SeriesHasBeenDeletedEvent): Promise<void> {
    const { series } = event.payload;
    if (series.status !== PostStatus.PUBLISHED) return;

    this._postServiceHistory.deleteEditedHistory(series.id).catch((e) => {
      this._logger.error(JSON.stringify(e?.stack));
      this._sentryService.captureException(e);
    });

    this._postSearchService.deletePostsToSearch([series]);

    const activity = this._postActivityService.createPayload({
      actor: {
        id: series.createdBy,
        username: 'unused',
        email: 'unused',
        avatar: 'unused',
        fullname: 'unused',
      },
      type: PostType.SERIES,
      title: series.title,
      commentsCount: series.commentsCount,
      totalUsersSeen: series.totalUsersSeen,
      content: series.content,
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
      createdBy: series.createdBy,
      status: series.status,
      setting: {
        canComment: series.canComment,
        canReact: series.canReact,
        canShare: series.canShare,
      },
      id: series.id,
      audience: {
        users: [],
        groups: (series?.groups ?? []).map((g) => ({
          id: g.groupId,
        })) as any,
      },
      privacy: series.privacy,
    });

    this._notificationService.publishPostNotification({
      key: `${series.id}`,
      value: {
        actor: {
          id: series.createdBy,
          username: 'unused',
          email: 'unused',
          avatar: 'unused',
          fullname: 'unused',
        },
        event: event.getEventName(),
        data: activity,
        meta: {
          series: {
            targetUserIds: [],
          },
        },
      },
    });
  }

  @On(SeriesHasBeenPublishedEvent)
  public async onSeriesPublished(event: SeriesHasBeenPublishedEvent): Promise<void> {
    const { series, actor } = event.payload;
    const { id, createdBy, audience, createdAt, updatedAt, title, summary, coverMedia } = series;
    const groupIds = audience.groups.map((group) => group.id);

    this._postSearchService.addPostsToSearch([
      {
        id,
        createdAt,
        updatedAt,
        createdBy,
        title,
        summary,
        groupIds: groupIds,
        isHidden: false,
        communityIds: audience.groups.map((group) => group.rootGroupId),
        type: PostType.SERIES,
        items: series.items.map((article) => ({ id: article.id, zindex: article.zindex })),
        coverMedia: {
          id: coverMedia.id,
          createdBy: coverMedia.createdBy,
          url: coverMedia.url,
          type: coverMedia.type as MediaType,
          createdAt: coverMedia.createdAt,
          name: coverMedia.name,
          originName: coverMedia.originName,
          width: coverMedia.width,
          height: coverMedia.height,
          extension: coverMedia.extension,
        },
      },
    ]);

    try {
      const activity = this._postActivityService.createPayload(series);

      let groupAdminIds = await this._groupAppService.getGroupAdminIds(actor, groupIds);

      groupAdminIds = groupAdminIds.filter((id) => id !== actor.id);

      if (groupAdminIds.length) {
        this._notificationService.publishPostNotification({
          key: `${series.id}`,
          value: {
            actor,
            event: event.getEventName(),
            data: activity,
            meta: {
              series: {
                targetUserIds: groupAdminIds,
              },
            },
          },
        });
      }
    } catch (ex) {
      this._logger.error(ex);
    }

    try {
      // Fanout to write post to all news feed of user follow group audience
      this._feedPublisherService.fanoutOnWrite(
        id,
        audience.groups.map((g) => g.id),
        []
      );
    } catch (error) {
      this._logger.error(JSON.stringify(error?.stack));
      this._sentryService.captureException(error);
    }
  }

  @On(SeriesHasBeenUpdatedEvent)
  public async onSeriesUpdated(event: SeriesHasBeenUpdatedEvent): Promise<void> {
    const { newSeries, oldSeries, actor } = event.payload;
    const {
      id,
      createdBy,
      updatedAt,
      audience,
      createdAt,
      lang,
      summary,
      title,
      coverMedia,
      items,
    } = newSeries;

    const groupIds = audience.groups.map((group) => group.id);

    this._postSearchService.updatePostsToSearch([
      {
        id,
        groupIds: groupIds,
        communityIds: audience.groups.map((group) => group.rootGroupId),
        createdAt,
        updatedAt,
        createdBy,
        isHidden: false,
        lang,
        summary,
        title,
        type: PostType.SERIES,
        items: items.map((article) => ({ id: article.id, zindex: article.zindex })),
        coverMedia: {
          id: coverMedia.id,
          url: coverMedia.url,
          type: coverMedia.type as MediaType,
          createdBy: coverMedia.createdBy,
          createdAt: coverMedia.createdAt,
          name: coverMedia.name,
          originName: coverMedia.originName,
          width: coverMedia.width,
          height: coverMedia.height,
          extension: coverMedia.extension,
        },
      },
    ]);

    try {
      // Fanout to write post to all news feed of user follow group audience
      this._feedPublisherService.fanoutOnWrite(
        id,
        audience.groups.map((g) => g.id),
        oldSeries.audience.groups.map((g) => g.id)
      );
    } catch (error) {
      this._logger.error(JSON.stringify(error?.stack));
      this._sentryService.captureException(error);
    }

    try {
      const updatedActivity = this._postActivityService.createPayload(newSeries);
      const oldActivity = this._postActivityService.createPayload(oldSeries);
      const oldGroupId = oldSeries.audience.groups.map((g) => g.id);

      const differenceGroupIds = [
        ...ArrayHelper.arrDifferenceElements<string>(groupIds, oldGroupId),
        ...ArrayHelper.arrDifferenceElements<string>(oldGroupId, groupIds),
      ];

      this._logger.debug(` differenceGroupIds: ${differenceGroupIds}`);

      if (differenceGroupIds.length) {
        const attachedGroupIds = differenceGroupIds.filter(
          (groupId) => !oldGroupId.includes(groupId)
        );

        if (!attachedGroupIds.length) {
          return;
        }

        const newGroupAdminIds = await this._groupAppService.getGroupAdminIds(
          actor,
          attachedGroupIds
        );

        const oldGroupAdminIds = await this._groupAppService.getGroupAdminIds(actor, oldGroupId);

        let filterGroupAdminIds = ArrayHelper.arrDifferenceElements<string>(
          newGroupAdminIds,
          oldGroupAdminIds
        );

        filterGroupAdminIds = filterGroupAdminIds.filter((id) => id !== actor.id);

        if (!filterGroupAdminIds.length) {
          return;
        }

        this._notificationService.publishPostNotification({
          key: `${id}`,
          value: {
            actor,
            event: event.getEventName(),
            data: updatedActivity,
            meta: {
              post: {
                oldData: oldActivity,
              },
              series: {
                targetUserIds: filterGroupAdminIds,
              },
            },
          },
        });
      }
    } catch (ex) {
      this._logger.error(ex);
    }
  }
}
