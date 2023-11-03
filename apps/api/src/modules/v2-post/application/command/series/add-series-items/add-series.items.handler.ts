import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ISeriesDomainService,
  SERIES_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';

import { AddSeriesItemsCommand } from './add-series-items.command';

@CommandHandler(AddSeriesItemsCommand)
export class AddSeriesItemsHandler implements ICommandHandler<AddSeriesItemsCommand, void> {
  public constructor(
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN)
    private readonly _seriesDomainService: ISeriesDomainService
  ) {}

  public async execute(command: AddSeriesItemsCommand): Promise<void> {
    return this._seriesDomainService.addSeriesItems(command.payload);
  }
}
