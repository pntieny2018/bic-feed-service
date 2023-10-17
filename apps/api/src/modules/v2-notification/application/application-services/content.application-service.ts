import { Inject } from '@nestjs/common';

import { KAFKA_TOPIC } from '../../../../common/constants';
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
  SeriesNotificationPayload,
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

    const kafkaPayload: NotificationPayloadDto<PostActivityObjectDto> = {
      key: post.id,
      value: {
        actor,
        event,
        data: activity,
      },
    };
    if (oldPost) {
      const oldPostObject = this._createPostActivityObject(oldPost);
      const oldActivity = this._createPostActivity(oldPostObject);
      kafkaPayload.value.meta['post']['oldData'] = oldActivity;
    }
    if (ignoreUserIds?.length) {
      kafkaPayload.value.meta['post']['ignoreUserIds'] = ignoreUserIds;
    }

    await this._kafkaAdapter.emit<NotificationPayloadDto<PostActivityObjectDto>>(
      KAFKA_TOPIC.STREAM.POST,
      kafkaPayload
    );
  }

  private _createPostActivityObject(post: PostDto): PostActivityObjectDto {
    return new PostActivityObjectDto({
      id: post.id,
      actor: post.actor,
      title: null,
      contentType: post.type.toLocaleLowerCase(),
      setting: post.setting,
      audience: post.audience,
      content: post.content,
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
      id: post.id,
      object: { ...post, contentType: post.contentType.toLowerCase() },
      verb: VerbActivity.POST,
      target: TargetType.POST,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    });
  }

  public async sendArticleNotification(payload: ArticleNotificationPayload): Promise<void> {
    const { event, actor, article, oldArticle, ignoreUserIds } = payload;

    const articleObject = this._createArticleActivityObject(article);
    const activity = this._createArticleActivity(articleObject);

    const kafkaPayload: NotificationPayloadDto<ArticleActivityObjectDto> = {
      key: article.id,
      value: {
        actor,
        event,
        data: activity,
        meta: {},
      },
    };
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

    await this._kafkaAdapter.emit<NotificationPayloadDto<ArticleActivityObjectDto>>(
      KAFKA_TOPIC.STREAM.POST,
      kafkaPayload
    );
  }

  private _createArticleActivityObject(article: ArticleDto): ArticleActivityObjectDto {
    return new ArticleActivityObjectDto({
      id: article.id,
      actor: article.actor,
      title: article.title,
      contentType: article.type.toLocaleLowerCase(),
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
      id: article.id,
      object: { ...article, contentType: article.contentType.toLowerCase() },
      verb: VerbActivity.POST,
      target: TargetType.ARTICLE,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    });
  }

  public async sendSeriesNotification(payload: SeriesNotificationPayload): Promise<void> {
    const {
      event,
      actor,
      series,
      item,
      verb,
      targetUserIds,
      isSendToContentCreator,
      contentIsDeleted,
      context,
    } = payload;

    const seriesObject = this._createSeriesActivityObject(series, item);
    const activity = this._createSeriesActivity(seriesObject, verb);

    const kafkaPayload: NotificationPayloadDto<SeriesActivityObjectDto> = {
      key: series.id,
      value: {
        actor,
        event,
        data: activity,
        meta: {},
      },
    };

    if (targetUserIds?.length) {
      kafkaPayload.value.meta.series = kafkaPayload.value.meta.series
        ? { ...kafkaPayload.value.meta.series, targetUserIds: targetUserIds }
        : { targetUserIds: targetUserIds };
    }
    if (isSendToContentCreator !== undefined || isSendToContentCreator !== null) {
      kafkaPayload.value.meta.series = kafkaPayload.value.meta.series
        ? { ...kafkaPayload.value.meta.series, isSendToContentCreator: isSendToContentCreator }
        : { isSendToContentCreator: isSendToContentCreator };
    }
    if (contentIsDeleted !== undefined || contentIsDeleted !== null) {
      kafkaPayload.value.meta.series = kafkaPayload.value.meta.series
        ? { ...kafkaPayload.value.meta.series, contentIsDeleted: contentIsDeleted }
        : { contentIsDeleted: contentIsDeleted };
    }
    if (context) {
      kafkaPayload.value.meta.series = kafkaPayload.value.meta.series
        ? { ...kafkaPayload.value.meta.series, context: context }
        : { context: context };
    }

    await this._kafkaAdapter.emit<NotificationPayloadDto<SeriesActivityObjectDto>>(
      KAFKA_TOPIC.STREAM.POST,
      kafkaPayload
    );
  }

  private _createSeriesActivityObject(
    series: SeriesDto,
    item: PostDto | ArticleDto
  ): SeriesActivityObjectDto {
    return new SeriesActivityObjectDto({
      id: series.id,
      actor: series.actor,
      title: series.title,
      contentType: series.type.toLocaleLowerCase(),
      setting: series.setting,
      audience: series.audience,
      item:
        item instanceof PostDto
          ? this._createPostActivityObject(item)
          : this._createArticleActivityObject(item),
      items: (series.items || []).map((item) =>
        item instanceof PostDto
          ? this._createPostActivityObject(item)
          : this._createArticleActivityObject(item as ArticleDto)
      ),
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
    });
  }

  private _createSeriesActivity(
    series: SeriesActivityObjectDto,
    verb: VerbActivity
  ): NotificationActivityDto<SeriesActivityObjectDto> {
    return new NotificationActivityDto<SeriesActivityObjectDto>({
      id: series.id,
      object: { ...series, contentType: series.contentType.toLowerCase() },
      verb: verb,
      target: TargetType.SERIES,
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
    });
  }
}
