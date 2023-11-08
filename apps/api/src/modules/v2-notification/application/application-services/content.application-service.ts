import { CONTENT_TYPE } from '@beincom/constants';
import { StringHelper } from '@libs/common/helpers';
import { Inject } from '@nestjs/common';
import { v4 } from 'uuid';

import {
  KAFKA_TOPIC,
  SeriesAddItem,
  SeriesChangeItems,
  SeriesHasBeenDeleted,
  SeriesHasBeenPublished,
  SeriesHasBeenUpdated,
  SeriesRemoveItem,
} from '../../../../common/constants';
import { ArticleDto, PostDto, SeriesDto } from '../../../v2-post/application/dto';
import { TargetType, VerbActivity } from '../../data-type';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../domain/infra-adapter-interface';
import {
  ArticleActivityObjectDto,
  NotificationActivityDto,
  NotificationPayloadDto,
  PostActivityObjectDto,
  SeriesActivityObjectDto,
} from '../dto';

import {
  ArticleNotificationPayload,
  IContentNotificationApplicationService,
  PostNotificationPayload,
  SeriesAddedItemNotificationPayload,
  SeriesChangedItemNotificationPayload,
  SeriesDeletedNotificationPayload,
  SeriesPublishedNotificationPayload,
  SeriesRemovedItemNotificationPayload,
  SeriesUpdatedNotificationPayload,
} from './interface';

export class ContentNotificationApplicationService
  implements IContentNotificationApplicationService
{
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async sendPostNotification(payload: PostNotificationPayload): Promise<void> {
    const { event, actor, post, oldPost, ignoreUserIds } = payload;

    const postObject = this._createPostActivityObject(post);
    const activity = this._createPostActivity(postObject);

    const kafkaPayload = new NotificationPayloadDto<PostActivityObjectDto>({
      key: post.id,
      value: {
        actor,
        event,
        data: activity,
        meta: {},
      },
    });
    if (oldPost) {
      const oldPostObject = this._createPostActivityObject(oldPost);
      const oldActivity = this._createPostActivity(oldPostObject);
      kafkaPayload.value.meta.post = kafkaPayload.value.meta.post
        ? { ...kafkaPayload.value.meta.post, oldData: oldActivity }
        : { oldData: oldActivity };
    }
    if (ignoreUserIds?.length) {
      kafkaPayload.value.meta.post = kafkaPayload.value.meta.post
        ? { ...kafkaPayload.value.meta.post, ignoreUserIds: ignoreUserIds }
        : { ignoreUserIds: ignoreUserIds };
    }

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.POST, kafkaPayload);
  }

  private _createPostActivityObject(post: PostDto): PostActivityObjectDto {
    return new PostActivityObjectDto({
      id: post.id,
      actor: post.actor,
      title: null,
      contentType: post.type,
      setting: post.setting,
      audience: post.audience,
      content: StringHelper.removeMarkdownCharacter(post.content),
      mentions: post.mentions,
      media: post.media,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    });
  }

  private _createPostActivity(
    post: PostActivityObjectDto
  ): NotificationActivityDto<PostActivityObjectDto> {
    return new NotificationActivityDto<PostActivityObjectDto>({
      id: v4(),
      object: post,
      verb: VerbActivity.POST,
      target: TargetType.POST,
      createdAt: new Date(),
    });
  }

  public async sendArticleNotification(payload: ArticleNotificationPayload): Promise<void> {
    const { event, actor, article, oldArticle, ignoreUserIds } = payload;

    const articleObject = this._createArticleActivityObject(article);
    const activity = this._createArticleActivity(articleObject);

    const kafkaPayload = new NotificationPayloadDto<ArticleActivityObjectDto>({
      key: article.id,
      value: {
        actor,
        event,
        data: activity,
        meta: {},
      },
    });
    if (oldArticle) {
      const oldArticleObject = this._createArticleActivityObject(oldArticle);
      const oldActivity = this._createArticleActivity(oldArticleObject);
      kafkaPayload.value.meta.post = kafkaPayload.value.meta.post
        ? { ...kafkaPayload.value.meta.post, oldData: oldActivity }
        : { oldData: oldActivity };
    }
    if (ignoreUserIds?.length) {
      kafkaPayload.value.meta.post = kafkaPayload.value.meta.post
        ? { ...kafkaPayload.value.meta.post, ignoreUserIds: ignoreUserIds }
        : { ignoreUserIds: ignoreUserIds };
    }

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.POST, kafkaPayload);
  }

  private _createArticleActivityObject(article: ArticleDto): ArticleActivityObjectDto {
    return new ArticleActivityObjectDto({
      id: article.id,
      actor: article.actor,
      title: article.title,
      contentType: article.type,
      setting: article.setting,
      audience: article.audience,
      content: article.content,
      mentions: article.mentions,
      summary: article.summary,
      cover: article.coverMedia?.url,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    });
  }

  private _createArticleActivity(
    article: ArticleActivityObjectDto
  ): NotificationActivityDto<ArticleActivityObjectDto> {
    return new NotificationActivityDto<ArticleActivityObjectDto>({
      id: v4(),
      object: article,
      verb: VerbActivity.POST,
      target: TargetType.ARTICLE,
      createdAt: new Date(),
    });
  }

  public async sendSeriesPublishedNotification(
    payload: SeriesPublishedNotificationPayload
  ): Promise<void> {
    const { actor, series, targetUserIds } = payload;

    const seriesObject = this._createSeriesActivityObject(series);
    const activity = this._createSeriesActivity(seriesObject, VerbActivity.POST);

    const kafkaPayload = new NotificationPayloadDto<SeriesActivityObjectDto>({
      key: series.id,
      value: {
        actor,
        event: SeriesHasBeenPublished,
        data: activity,
        meta: {
          series: { targetUserIds },
        },
      },
    });

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.POST, kafkaPayload);
  }

  public async sendSeriesDeletedNotification(
    payload: SeriesDeletedNotificationPayload
  ): Promise<void> {
    const { actor, series } = payload;

    const items = series.items || [];
    const existingCreator = new Set([]);
    const filterItems = [];
    for (const item of items) {
      if (!existingCreator.has(item.createdBy) && item.createdBy !== actor.id) {
        filterItems.push(item);
        existingCreator.add(item.createdBy);
      }
    }
    series.items = filterItems;
    const seriesObject = this._createSeriesActivityObject(series);
    const activity = this._createSeriesActivity(seriesObject, VerbActivity.DELETE);

    const kafkaPayload = new NotificationPayloadDto<SeriesActivityObjectDto>({
      key: series.id,
      value: {
        actor,
        event: SeriesHasBeenDeleted,
        data: activity,
        meta: {},
      },
    });

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.POST, kafkaPayload);
  }

  public async sendSeriesUpdatedNotification(
    payload: SeriesUpdatedNotificationPayload
  ): Promise<void> {
    const { actor, series, oldSeries, targetUserIds } = payload;

    const seriesObject = this._createSeriesActivityObject(series);
    const activity = this._createSeriesActivity(seriesObject, VerbActivity.POST);

    const oldSeriesObject = this._createSeriesActivityObject(oldSeries);
    const oldActivity = this._createSeriesActivity(oldSeriesObject, VerbActivity.POST);

    const kafkaPayload = new NotificationPayloadDto<SeriesActivityObjectDto>({
      key: series.id,
      value: {
        actor,
        event: SeriesHasBeenUpdated,
        data: activity,
        meta: {
          post: { oldData: oldActivity },
          series: { targetUserIds },
        },
      },
    });

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.POST, kafkaPayload);
  }

  public async sendSeriesAddedItemNotification(
    payload: SeriesAddedItemNotificationPayload
  ): Promise<void> {
    const { actor, series, item, isSendToContentCreator, context } = payload;

    const seriesObject = this._createSeriesActivityObject(series, item);
    const activity = this._createSeriesActivity(seriesObject, VerbActivity.ADD);

    const kafkaPayload = new NotificationPayloadDto<SeriesActivityObjectDto>({
      key: series.id,
      value: {
        actor,
        event: SeriesAddItem,
        data: activity,
        meta: {
          series: { isSendToContentCreator, context },
        },
      },
    });

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.POST, kafkaPayload);
  }

  public async sendSeriesRemovedItemNotification(
    payload: SeriesRemovedItemNotificationPayload
  ): Promise<void> {
    const { actor, series, item, isSendToContentCreator, contentIsDeleted } = payload;

    const seriesObject = this._createSeriesActivityObject(series, item);
    const activity = this._createSeriesActivity(seriesObject, VerbActivity.REMOVE);

    const kafkaPayload = new NotificationPayloadDto<SeriesActivityObjectDto>({
      key: series.id,
      value: {
        actor,
        event: SeriesRemoveItem,
        data: activity,
        meta: {
          series: { isSendToContentCreator, contentIsDeleted },
        },
      },
    });

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.POST, kafkaPayload);
  }

  public async sendSeriesChangedItemNotification(
    payload: SeriesChangedItemNotificationPayload
  ): Promise<void> {
    const { actor, series, item } = payload;

    const seriesObject = new SeriesActivityObjectDto({
      id: item.id,
      actor: item.actor,
      title: item.type === CONTENT_TYPE.ARTICLE ? (item as ArticleDto).title : null,
      contentType: item.type,
      audience: item.audience,
      items: series.map(
        (seriesItem) =>
          new SeriesActivityObjectDto({
            id: seriesItem.id,
            actor: seriesItem.actor,
            title: seriesItem.title,
            contentType: seriesItem.type,
            audience: seriesItem.audience,
            state: seriesItem.state,
            createdAt: seriesItem.createdAt,
            updatedAt: seriesItem.updatedAt,
          })
      ),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
    const activity = this._createSeriesActivity(seriesObject, VerbActivity.CHANGE);

    const kafkaPayload = new NotificationPayloadDto<SeriesActivityObjectDto>({
      key: series[0].id,
      value: {
        actor,
        event: SeriesChangeItems,
        data: activity,
        meta: {
          series: {},
        },
      },
    });

    await this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.POST, kafkaPayload);
  }

  private _createSeriesActivityObject(
    series: SeriesDto,
    content?: PostDto | ArticleDto
  ): SeriesActivityObjectDto {
    return new SeriesActivityObjectDto({
      id: series.id,
      actor: series.actor,
      title: series.title,
      contentType: series.type,
      setting: series.setting,
      audience: series.audience,
      item: content ? this._getItemObject(content) : null,
      items: (series.items || []).map((item) => this._getItemObject(item as PostDto | ArticleDto)),
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
    });
  }

  private _getItemObject(
    item: PostDto | ArticleDto
  ): PostActivityObjectDto | ArticleActivityObjectDto {
    return item.type === CONTENT_TYPE.POST
      ? this._createPostActivityObject(item as PostDto)
      : this._createArticleActivityObject(item as ArticleDto);
  }

  private _createSeriesActivity(
    series: SeriesActivityObjectDto,
    verb: VerbActivity
  ): NotificationActivityDto<SeriesActivityObjectDto> {
    return new NotificationActivityDto<SeriesActivityObjectDto>({
      id: v4(),
      object: series,
      verb: verb,
      target: TargetType.SERIES,
      createdAt: new Date(),
    });
  }
}
