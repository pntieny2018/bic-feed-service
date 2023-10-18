import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ISeriesDomainService,
  SERIES_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';

import { RemoveSeriesItemsCommand } from './remove-series-items.command';

@CommandHandler(RemoveSeriesItemsCommand)
export class RemoveSeriesItemsHandler implements ICommandHandler<RemoveSeriesItemsCommand, void> {
  public constructor(
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN)
    private readonly _seriesDomainService: ISeriesDomainService
  ) {}

  public async execute(command: RemoveSeriesItemsCommand): Promise<void> {
    return this._seriesDomainService.removeSeriesItems(command.payload);
  }
}
