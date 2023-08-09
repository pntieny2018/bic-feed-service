import { EventBus } from '@nestjs/cqrs';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from './interface/media.domain-service.interface';
import {
  CreateSeriesProps,
  UpdateSeriesProps,
  ISeriesDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
  IPostDomainService,
} from './interface';
import { SeriesEntity } from '../model/content';
import { AccessDeniedException, ContentNotFoundException } from '../exception';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';
import { ISeriesFactory, SERIES_FACTORY_TOKEN } from '../factory/interface';
import { InvalidResourceImageException } from '../exception/invalid-resource-image.exception';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../validator/interface';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../../../v2-group/application';
import { SeriesUpdatedEvent } from '../event/series-updated.event';

@Injectable()
export class SeriesDomainService implements ISeriesDomainService {
  private readonly _logger = new Logger(SeriesDomainService.name);

  public constructor(
    private readonly event: EventBus,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService,
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,
    @Inject(SERIES_FACTORY_TOKEN)
    private readonly _seriesFactory: ISeriesFactory,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async create(input: CreateSeriesProps): Promise<SeriesEntity> {
    const { actor, title, summary, groupIds, coverMedia, setting, groups } = input.data;
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
      return seriesEntity;
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
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

    if (!seriesEntity.isOwner(actor.id)) throw new AccessDeniedException();

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

    if (groupIds) {
      const oldGroupIds = seriesEntity.get('groupIds');
      const groups = await this._groupAppService.findAllByIds(groupIds);

      this._contentValidator.checkCanReadContent(seriesEntity, actor);
      await this._contentValidator.checkCanCRUDContent(
        actor,
        oldGroupIds,
        seriesEntity.get('type')
      );

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

    if (!seriesEntity.isChanged()) return seriesEntity;

    await this._contentRepository.update(seriesEntity);

    if (!isImportantBefore && seriesEntity.isImportant()) {
      await this._postDomainService.markReadImportant(seriesEntity, actor.id);
      seriesEntity.setMarkReadImportant();
    }

    this.event.publish(new SeriesUpdatedEvent(seriesEntity));

    return seriesEntity;
  }
}
