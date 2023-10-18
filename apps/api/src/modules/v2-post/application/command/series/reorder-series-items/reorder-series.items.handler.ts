import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ISeriesDomainService,
  SERIES_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';

import { ReorderSeriesItemsCommand } from './reorder-series-items.command';

@CommandHandler(ReorderSeriesItemsCommand)
export class ReorderSeriesItemsHandler implements ICommandHandler<ReorderSeriesItemsCommand, void> {
  public constructor(
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN)
    private readonly _seriesDomainService: ISeriesDomainService
  ) {}

  public async execute(command: ReorderSeriesItemsCommand): Promise<void> {
    return this._seriesDomainService.reorderSeriesItems(command.payload);
  }
}
