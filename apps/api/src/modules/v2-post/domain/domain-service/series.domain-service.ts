import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from './interface/media.domain-service.interface';
import { CreateSeriesProps, ISeriesDomainService } from './interface';
import { SeriesEntity } from '../model/content/series.entity';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';
import { ISeriesFactory, SERIES_FACTORY_TOKEN } from '../factory/interface';
import { InvalidResourceImageException } from '../exception/invalid-resource-image.exception';
import { ISeriesValidator, SERIES_VALIDATOR_TOKEN } from '../validator/interface';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { isNil } from 'lodash';

@Injectable()
export class SeriesDomainService implements ISeriesDomainService {
  private readonly _logger = new Logger(SeriesDomainService.name);

  public constructor(
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService,
    @Inject(SERIES_FACTORY_TOKEN)
    private readonly _seriesFactory: ISeriesFactory,
    @Inject(SERIES_VALIDATOR_TOKEN)
    private readonly _seriesValidator: ISeriesValidator,
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

    if (groupIds.length) {
      const isEnableSetting = seriesEntity.getState().enableSetting;
      await this._seriesValidator.checkCanCreateSeries(actor, groups, isEnableSetting);
      seriesEntity.setGroups(groupIds);
      seriesEntity.setPrivacyFromGroups(groups);
    }

    if (!isNil(coverMedia) && coverMedia?.id) {
      const images = await this._mediaDomainService.getAvailableImages(
        [],
        [coverMedia.id],
        seriesEntity.get('createdBy')
      );
      if (images[0] && !images[0].isSeriesCoverResource()) {
        throw new InvalidResourceImageException();
      }
      seriesEntity.setCover(images[0]);
    }

    try {
      await this._contentRepository.create(seriesEntity);
      return seriesEntity;
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }
}
