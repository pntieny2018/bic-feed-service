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
} from '../../../binding/binding-post/content.binding.interface';
import { SeriesDto } from '../../../dto';

import { UpdateSeriesCommand } from './update-series.command';

@CommandHandler(UpdateSeriesCommand)
export class UpdateSeriesHandler implements ICommandHandler<UpdateSeriesCommand, SeriesDto> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN)
    private readonly _seriesDomainService: ISeriesDomainService
  ) {}

  public async execute(command: UpdateSeriesCommand): Promise<SeriesDto> {
    const { actor, groupIds, coverMedia } = command.payload;

    if (coverMedia && !coverMedia.id) {
      throw new SeriesRequiredCoverException();
    }

    if (groupIds && groupIds.length === 0) {
      throw new ContentEmptyGroupException();
    }

    const seriesEntity = await this._seriesDomainService.update(command.payload);

    const result = await this._contentBinding.seriesBinding(seriesEntity, {
      actor,
      authUser: actor,
    });

    return result;
  }
}
