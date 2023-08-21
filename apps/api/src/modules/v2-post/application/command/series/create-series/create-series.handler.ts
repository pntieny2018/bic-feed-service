import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ISeriesDomainService,
  SERIES_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import {
  ContentEmptyGroupException,
  SeriesRequiredCoverException,
} from '../../../../domain/exception';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../../binding/binding-post/content.interface';
import { CreateSeriesDto } from '../../../dto';

import { CreateSeriesCommand } from './create-series.command';

@CommandHandler(CreateSeriesCommand)
export class CreateSeriesHandler implements ICommandHandler<CreateSeriesCommand, CreateSeriesDto> {
  public constructor(
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN)
    private readonly _seriesDomainService: ISeriesDomainService,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding
  ) {}

  public async execute(command: CreateSeriesCommand): Promise<CreateSeriesDto> {
    const { actor, groupIds, coverMedia } = command.payload;

    if (!groupIds || groupIds.length === 0) {
      throw new ContentEmptyGroupException();
    }

    if (!coverMedia || !coverMedia.id) {
      throw new SeriesRequiredCoverException();
    }

    const seriesEntity = await this._seriesDomainService.create(command.payload);

    const result = await this._contentBinding.seriesBinding(seriesEntity, {
      actor,
      authUser: actor,
    });

    return result;
  }
}
