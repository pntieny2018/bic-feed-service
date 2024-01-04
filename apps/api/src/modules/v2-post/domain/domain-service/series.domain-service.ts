import { CONTENT_STATUS } from '@beincom/constants';
import { UserDto } from '@libs/service/user';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { DatabaseException } from '../../../../common/exceptions';
import { EntityHelper } from '../../../../common/helpers';
import {
  SeriesPublishedEvent,
  SeriesUpdatedEvent,
  SeriesDeletedEvent,
  SeriesItemsReorderedEvent,
  SeriesItemsAddedEvent,
  SeriesItemsRemovedEvent,
  SeriesSameOwnerChangedEvent,
  SeriesItemsRemovedPayload,
  SeriesItemsAddedPayload,
  ContentAttachedSeriesEvent,
} from '../event';
import {
  ContentAccessDeniedException,
  ContentNoCRUDPermissionException,
  ContentNotFoundException,
  InvalidResourceImageException,
} from '../exception';
import { ArticleEntity, PostEntity, SeriesEntity } from '../model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';
import { GROUP_ADAPTER, IGroupAdapter } from '../service-adapter-interface';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../validator/interface';

import {
  CreateSeriesProps,
  UpdateSeriesProps,
  ISeriesDomainService,
  DeleteSeriesProps,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
  AddSeriesItemsProps,
  RemoveSeriesItemsProps,
  ReorderSeriesItemsProps,
  SendContentUpdatedSeriesEventProps,
} from './interface';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from './interface/media.domain-service.interface';

@Injectable()
export class SeriesDomainService implements ISeriesDomainService {
  private readonly _logger = new Logger(SeriesDomainService.name);

  public constructor(
    private readonly event: EventBus,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async getSeriesById(seriesId: string, authUser: UserDto): Promise<SeriesEntity> {
    const seriesEntity = await this._contentRepository.findContentWithCache(
      {
        where: {
          id: seriesId,
          groupArchived: false,
          excludeReportedByUserId: authUser.id,
        },
        include: {
          mustIncludeGroup: true,
          shouldIncludeItems: true,
          shouldIncludeCategory: true,
        },
      },
      authUser
    );

    if (
      !seriesEntity ||
      !(seriesEntity instanceof SeriesEntity) ||
      (seriesEntity.isDraft() && !seriesEntity.isOwner(authUser.id)) ||
      seriesEntity.isHidden()
    ) {
      throw new ContentNotFoundException();
    }

    if (!authUser && !seriesEntity.isOpen()) {
      throw new ContentAccessDeniedException();
    }

    return seriesEntity;
  }

  public async findSeriesByIds(seriesIds: string[], withItems?: boolean): Promise<SeriesEntity[]> {
    return (await this._contentRepository.findAll({
      attributes: {
        exclude: ['content'],
      },
      where: {
        groupArchived: false,
        ids: seriesIds,
      },
      include: {
        mustIncludeGroup: true,
        shouldIncludeItems: withItems,
      },
    })) as SeriesEntity[];
  }

  public async create(input: CreateSeriesProps): Promise<SeriesEntity> {
    const { actor, title, summary, groupIds, coverMedia, setting } = input;
    const seriesEntity = SeriesEntity.create({ title, summary }, actor.id);

    seriesEntity.setSetting(setting);
    const state = seriesEntity.getState();

    const groups = await this._groupAdapter.getGroupsByIds(groupIds);

    await this._contentValidator.checkCanCRUDContent({
      user: actor,
      groupIds,
      contentType: seriesEntity.get('type'),
      groups,
    });

    if (state?.enableSetting) {
      await this._contentValidator.checkCanEditContentSetting(actor, groupIds);
    }

    seriesEntity.setGroups(groupIds);
    seriesEntity.setPrivacyFromGroups(groups);

    const images = await this._mediaDomainService.getAvailableImages(
      [],
      [coverMedia.id],
      seriesEntity.get('createdBy')
    );
    if (!images[0] || !images[0].isSeriesCoverResource()) {
      throw new InvalidResourceImageException();
    }
    seriesEntity.setCover(images[0]);

    try {
      await this._contentRepository.create(seriesEntity);

      await this._contentDomainService.markSeen(seriesEntity.get('id'), actor.id);
      seriesEntity.increaseTotalSeen();

      if (seriesEntity.isImportant()) {
        await this._contentDomainService.markReadImportant(seriesEntity.get('id'), actor.id);
        seriesEntity.setMarkReadImportant();
      }
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }

    this.event.publish(new SeriesPublishedEvent({ entity: seriesEntity, authUser: actor }));

    return seriesEntity;
  }

  public async update(input: UpdateSeriesProps): Promise<SeriesEntity> {
    const { id, actor, groupIds, coverMedia } = input;

    const seriesEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        mustIncludeGroup: true,
        shouldIncludeItems: true,
        shouldIncludeMarkReadImportant: {
          userId: actor?.id,
        },
        shouldIncludeSaved: {
          userId: actor.id,
        },
      },
    });

    if (!seriesEntity || !(seriesEntity instanceof SeriesEntity)) {
      throw new ContentNotFoundException();
    }

    if (!seriesEntity.isOwner(actor.id)) {
      throw new ContentAccessDeniedException();
    }

    const isImportantBefore = seriesEntity.isImportant();
    const isEnableSetting = seriesEntity.isEnableSetting();

    if (coverMedia) {
      const images = await this._mediaDomainService.getAvailableImages(
        [seriesEntity.get('cover')],
        [coverMedia.id],
        seriesEntity.get('createdBy')
      );
      if (images[0] && !images[0].isSeriesCoverResource()) {
        throw new InvalidResourceImageException();
      }
      seriesEntity.setCover(images[0]);
    }

    await this._contentValidator.checkCanReadContent(seriesEntity, actor);

    const oldGroupIds = seriesEntity.get('groupIds');
    await this._contentValidator.checkCanCRUDContent({
      user: actor,
      groupIds: oldGroupIds,
      contentType: seriesEntity.get('type'),
    });

    if (groupIds) {
      const groups = await this._groupAdapter.getGroupsByIds(groupIds);

      seriesEntity.setGroups(groupIds);
      seriesEntity.setPrivacyFromGroups(groups);

      const state = seriesEntity.getState();
      const { attachGroupIds, detachGroupIds } = state;

      if (attachGroupIds?.length) {
        await this._contentValidator.checkCanCRUDContent({
          user: actor,
          groupIds: attachGroupIds,
          contentType: seriesEntity.get('type'),
        });
      }

      if (isEnableSetting && (attachGroupIds?.length || detachGroupIds?.length)) {
        await this._contentValidator.checkCanEditContentSetting(actor, groupIds);
      }
    }

    seriesEntity.updateAttribute(input, actor.id);

    if (!seriesEntity.isChanged()) {
      return seriesEntity;
    }

    await this._contentRepository.update(seriesEntity);

    if (!isImportantBefore && seriesEntity.isImportant()) {
      await this._contentDomainService.markReadImportant(seriesEntity.get('id'), actor.id);
      seriesEntity.setMarkReadImportant();
    }

    this.event.publish(new SeriesUpdatedEvent({ entity: seriesEntity, authUser: actor }));

    return seriesEntity;
  }

  public async delete(input: DeleteSeriesProps): Promise<void> {
    const { actor, id } = input;

    const seriesEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        mustIncludeGroup: true,
        shouldIncludeItems: true,
      },
    });

    if (!seriesEntity || !(seriesEntity instanceof SeriesEntity)) {
      throw new ContentNotFoundException();
    }

    if (!seriesEntity.isOwner(actor.id)) {
      throw new ContentAccessDeniedException();
    }

    await this._contentValidator.checkCanReadContent(seriesEntity, actor);

    await this._contentValidator.checkCanCRUDContent({
      user: actor,
      groupIds: seriesEntity.get('groupIds'),
      contentType: seriesEntity.get('type'),
    });

    await this._contentRepository.delete(seriesEntity.get('id'));

    this.event.publish(new SeriesDeletedEvent({ entity: seriesEntity, authUser: actor }));
  }

  public async findItemsInSeries(
    itemIds: string[],
    authUserId: string
  ): Promise<(PostEntity | ArticleEntity)[]> {
    return (await this._contentRepository.findAll({
      where: {
        ids: itemIds,
        isHidden: false,
        groupArchived: false,
        status: CONTENT_STATUS.PUBLISHED,
        excludeReportedByUserId: authUserId,
      },
    })) as (PostEntity | ArticleEntity)[];
  }

  public async addSeriesItems(input: AddSeriesItemsProps): Promise<void> {
    const { id, authUser, itemId } = input;

    const seriesEntity = await this._contentRepository.findContentByIdInActiveGroup(id, {
      shouldIncludeGroup: true,
      shouldIncludeItems: true,
    });

    if (!seriesEntity || !(seriesEntity instanceof SeriesEntity)) {
      throw new ContentNotFoundException();
    }

    if (!seriesEntity.isOwner(authUser.id)) {
      throw new ContentAccessDeniedException();
    }

    await this._contentValidator.checkCanCRUDContent({
      user: authUser,
      groupIds: seriesEntity.get('groupIds'),
      contentType: seriesEntity.get('type'),
    });

    const content = (await this._contentRepository.findContentByIdInActiveGroup(itemId, {
      mustIncludeGroup: true,
      shouldIncludeSeries: true,
    })) as ArticleEntity | PostEntity;

    if (!content || content.isHidden()) {
      throw new ContentNotFoundException();
    }

    const isValid = content
      .getGroupIds()
      .some((groupId) => seriesEntity.getGroupIds().includes(groupId));

    if (!isValid) {
      throw new ContentNoCRUDPermissionException();
    }

    content.setSeriesIds(uniq([...content.getSeriesIds(), id]));
    await this._contentValidator.validateLimitedToAttachSeries(content);

    await this._contentRepository.createPostSeries(id, itemId);

    this.event.publish(new ContentAttachedSeriesEvent({ contentId: itemId }));
    this.event.publish(
      new SeriesItemsAddedEvent({
        authUser,
        seriesId: id,
        item: content,
        context: 'add',
      })
    );
  }

  public async removeSeriesItems(input: RemoveSeriesItemsProps): Promise<void> {
    const { id, authUser, itemId } = input;

    const seriesEntity = await this._contentRepository.findContentByIdInActiveGroup(id, {
      mustIncludeGroup: true,
    });

    if (!seriesEntity || !(seriesEntity instanceof SeriesEntity)) {
      throw new ContentNotFoundException();
    }

    if (!seriesEntity.isOwner(authUser.id)) {
      throw new ContentAccessDeniedException();
    }

    await this._contentValidator.checkCanCRUDContent({
      user: authUser,
      groupIds: seriesEntity.get('groupIds'),
      contentType: seriesEntity.get('type'),
    });

    const content = (await this._contentRepository.findContentByIdInActiveGroup(itemId, {
      mustIncludeGroup: true,
    })) as ArticleEntity | PostEntity;

    if (!content || content.isHidden()) {
      throw new ContentNotFoundException();
    }

    await this._contentRepository.deletePostSeries(id, itemId);

    this.event.publish(new ContentAttachedSeriesEvent({ contentId: itemId }));
    this.event.publish(
      new SeriesItemsRemovedEvent({
        authUser,
        seriesId: id,
        item: content,
        contentIsDeleted: false,
      })
    );
  }

  public async reorderSeriesItems(input: ReorderSeriesItemsProps): Promise<void> {
    const { id, authUser, itemIds } = input;

    const seriesEntity = await this._contentRepository.findContentByIdInActiveGroup(id, {
      mustIncludeGroup: true,
    });

    if (!seriesEntity || !(seriesEntity instanceof SeriesEntity)) {
      throw new ContentNotFoundException();
    }

    if (!seriesEntity.isOwner(authUser.id)) {
      throw new ContentAccessDeniedException();
    }

    await this._contentValidator.checkCanCRUDContent({
      user: authUser,
      groupIds: seriesEntity.get('groupIds'),
      contentType: seriesEntity.get('type'),
    });

    await this._contentRepository.reorderPostsSeries(id, itemIds);

    this.event.publish(new SeriesItemsReorderedEvent(id));
  }

  public sendSeriesItemsAddedEvent(input: SeriesItemsAddedPayload): void {
    this.event.publish(new SeriesItemsAddedEvent(input));
  }

  public sendSeriesItemsRemovedEvent(input: SeriesItemsRemovedPayload): void {
    this.event.publish(new SeriesItemsRemovedEvent(input));
  }

  public async sendContentUpdatedSeriesEvent(
    input: SendContentUpdatedSeriesEventProps
  ): Promise<void> {
    const { content, actor } = input;

    const { attachSeriesIds, detachSeriesIds } = content.getState();

    const series = (await this._contentRepository.findAll({
      where: {
        groupArchived: false,
        isHidden: false,
        ids: [...attachSeriesIds, ...detachSeriesIds],
      },
      include: {
        mustIncludeGroup: true,
      },
    })) as SeriesEntity[];

    const addSeries = series.filter((series) => attachSeriesIds.includes(series.getId()));
    const removeSeries = series.filter((series) => detachSeriesIds.includes(series.getId()));

    const {
      skipNotifyForAddSeriesIds,
      skipNotifyForRemoveSeriesIds,
      sameChangeSeriesOwnerIds,
      seriesMap,
    } = this._processSameChangeSeries(addSeries, removeSeries);

    if (sameChangeSeriesOwnerIds.length) {
      sameChangeSeriesOwnerIds.forEach((ownerId) => {
        this.event.publish(
          new SeriesSameOwnerChangedEvent({
            authUser: actor,
            series: seriesMap[ownerId].map((item) => ({
              item,
              state: addSeries.some((s) => s.getId() === item.getId()) ? 'add' : 'remove',
            })),
            content,
          })
        );
      });
    }

    if (attachSeriesIds.length) {
      attachSeriesIds.forEach((seriesId) => {
        this.sendSeriesItemsAddedEvent({
          authUser: actor,
          seriesId,
          item: content,
          skipNotify: skipNotifyForAddSeriesIds.includes(seriesId) || content.isHidden(),
          context: 'publish',
        });
      });
    }

    if (detachSeriesIds.length) {
      detachSeriesIds.forEach((seriesId) => {
        this.sendSeriesItemsRemovedEvent({
          authUser: actor,
          seriesId,
          item: content,
          contentIsDeleted: false,
          skipNotify: skipNotifyForRemoveSeriesIds.includes(seriesId) || content.isHidden(),
        });
      });
    }
  }

  private _processSameChangeSeries(
    addSeries: SeriesEntity[],
    removeSeries: SeriesEntity[]
  ): {
    skipNotifyForAddSeriesIds: string[];
    skipNotifyForRemoveSeriesIds: string[];
    sameChangeSeriesOwnerIds: string[];
    seriesMap: Record<string, SeriesEntity[]>;
  } {
    let skipNotifyForAddSeriesIds = [];
    let skipNotifyForRemoveSeriesIds = [];
    let sameChangeSeriesOwnerIds = [];
    let seriesMap = {};

    if (addSeries.length && removeSeries.length) {
      /**
       * example of seriesMap
       * {
       *  'user1': [series1, series2],
       *  'user2': [series3, series4],
       *  'user3': [series5],
       * }
       */
      seriesMap = EntityHelper.entityArrayToArrayRecord<SeriesEntity>(
        [...addSeries, ...removeSeries],
        'createdBy'
      );
      sameChangeSeriesOwnerIds = Object.keys(seriesMap).filter(
        (ownerId) =>
          addSeries.some((series) => series.get('createdBy') === ownerId) &&
          removeSeries.some((series) => series.get('createdBy') === ownerId)
      );

      if (sameChangeSeriesOwnerIds.length) {
        skipNotifyForAddSeriesIds = addSeries
          .filter((series) => sameChangeSeriesOwnerIds.includes(series.get('createdBy')))
          .map((series) => series.getId());
        skipNotifyForRemoveSeriesIds = removeSeries
          .filter((series) => sameChangeSeriesOwnerIds.includes(series.get('createdBy')))
          .map((series) => series.getId());
      }
    }

    return {
      skipNotifyForAddSeriesIds,
      skipNotifyForRemoveSeriesIds,
      sameChangeSeriesOwnerIds,
      seriesMap,
    };
  }
}
