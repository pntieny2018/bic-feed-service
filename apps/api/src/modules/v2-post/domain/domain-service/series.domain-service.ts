import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from './interface/media.domain-service.interface';
import { CreateSeriesProps, UpdateSeriesProps, ISeriesDomainService } from './interface';
import { SeriesEntity } from '../model/content/series.entity';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';
import { ISeriesFactory, SERIES_FACTORY_TOKEN } from '../factory/interface';
import { InvalidResourceImageException } from '../exception/invalid-resource-image.exception';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../validator/interface';
import { DatabaseException } from '../../../../common/exceptions/database.exception';

@Injectable()
export class SeriesDomainService implements ISeriesDomainService {
  private readonly _logger = new Logger(SeriesDomainService.name);

  public constructor(
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService,
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
    const isEnableSetting = seriesEntity.getState().enableSetting;

    await this._contentValidator.checkCanCRUDContent(actor, groupIds, seriesEntity.get('type'));
    if (isEnableSetting) await this._contentValidator.checkCanEditContentSetting(actor, groupIds);

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

  public async update(input: UpdateSeriesProps): Promise<void> {
    const { seriesEntity, groups, newData } = input;
    const { actor, groupIds, coverMedia, setting } = newData;

    seriesEntity.setSetting(setting || seriesEntity.get('setting'));

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
      this._contentValidator.checkCanReadContent(seriesEntity, actor);

      const oldGroupIds = seriesEntity.get('groupIds');
      await this._contentValidator.checkCanCRUDContent(
        actor,
        oldGroupIds,
        seriesEntity.get('type')
      );

      seriesEntity.setGroups(groupIds);
      seriesEntity.setPrivacyFromGroups(groups);
      const state = seriesEntity.getState();
      const attachGroupIds = state.attachGroupIds;
      const isEnableSetting = state.enableSetting;

      if (attachGroupIds?.length) {
        await this._contentValidator.checkCanCRUDContent(
          actor,
          attachGroupIds,
          seriesEntity.get('type')
        );
      }
      if (isEnableSetting) await this._contentValidator.checkCanEditContentSetting(actor, groupIds);
    }

    seriesEntity.updateAttribute(newData);

    if (!seriesEntity.isChanged()) return;

    await this._contentRepository.update(seriesEntity);
  }
}
