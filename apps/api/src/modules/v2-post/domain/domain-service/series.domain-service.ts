import { CONTENT_STATUS } from '@beincom/constants';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { SeriesCreatedEvent, SeriesUpdatedEvent, SeriesDeletedEvent } from '../event';
import {
  ContentAccessDeniedException,
  ContentNoCRUDPermissionException,
  ContentNotFoundException,
} from '../exception';
import { InvalidResourceImageException } from '../exception/media.exception';
import { ISeriesFactory, SERIES_FACTORY_TOKEN } from '../factory/interface';
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
    @Inject(SERIES_FACTORY_TOKEN)
    private readonly _seriesFactory: ISeriesFactory,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

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
    const seriesEntity = this._seriesFactory.createSeries({
      userId: actor.id,
      title,
      summary,
    });

    seriesEntity.setSetting(setting);
    const state = seriesEntity.getState();

    await this._contentValidator.checkCanCRUDContent(actor, groupIds, seriesEntity.get('type'));

    if (state?.enableSetting) {
      await this._contentValidator.checkCanEditContentSetting(actor, groupIds);
    }

    const groups = await this._groupAdapter.getGroupsByIds(groupIds);
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

    this.event.publish(new SeriesCreatedEvent(seriesEntity));

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

    this._contentValidator.checkCanReadContent(seriesEntity, actor);

    const oldGroupIds = seriesEntity.get('groupIds');
    await this._contentValidator.checkCanCRUDContent(actor, oldGroupIds, seriesEntity.get('type'));

    if (groupIds) {
      const groups = await this._groupAdapter.getGroupsByIds(groupIds);

      seriesEntity.setGroups(groupIds);
      seriesEntity.setPrivacyFromGroups(groups);

      const state = seriesEntity.getState();
      const { attachGroupIds, detachGroupIds } = state;

      if (attachGroupIds?.length) {
        await this._contentValidator.checkCanCRUDContent(
          actor,
          attachGroupIds,
          seriesEntity.get('type')
        );
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

    this.event.publish(new SeriesUpdatedEvent(seriesEntity));

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

    this._contentValidator.checkCanReadContent(seriesEntity, actor);

    await this._contentValidator.checkCanCRUDContent(
      actor,
      seriesEntity.get('groupIds'),
      seriesEntity.get('type')
    );

    await this._contentRepository.delete(seriesEntity.get('id'));

    this.event.publish(new SeriesDeletedEvent(seriesEntity));
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
    const { id, authUser, itemIds } = input;

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

    await this._contentValidator.checkCanCRUDContent(
      authUser,
      seriesEntity.get('groupIds'),
      seriesEntity.get('type')
    );

    const contents = (await this._contentRepository.findAll({
      where: {
        ids: itemIds,
        groupArchived: false,
      },
      include: {
        mustIncludeGroup: true,
        shouldIncludeSeries: true,
      },
    })) as (ArticleEntity | PostEntity)[];

    if (itemIds.length !== contents.length) {
      throw new ContentNotFoundException();
    }

    for (const content of contents) {
      const isValid = content
        .getGroupIds()
        .some((groupId) => seriesEntity.getGroupIds().includes(groupId));

      if (!isValid) {
        throw new ContentNoCRUDPermissionException();
      }

      content.setSeriesIds(uniq([...content.getSeriesIds(), seriesEntity.getId()]));
      await this._contentValidator.validateLimitedToAttachSeries(content);
    }

    try {
      await this._contentRepository.createPostsSeries(seriesEntity.getId(), itemIds);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }

  public async removeSeriesItems(input: RemoveSeriesItemsProps): Promise<void> {
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

    await this._contentValidator.checkCanCRUDContent(
      authUser,
      seriesEntity.get('groupIds'),
      seriesEntity.get('type')
    );

    try {
      await this._contentRepository.deletePostsSeries(seriesEntity.getId(), itemIds);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
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

    await this._contentValidator.checkCanCRUDContent(
      authUser,
      seriesEntity.get('groupIds'),
      seriesEntity.get('type')
    );

    try {
      await this._contentRepository.updatePostsSeries(seriesEntity.getId(), itemIds);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }
}
