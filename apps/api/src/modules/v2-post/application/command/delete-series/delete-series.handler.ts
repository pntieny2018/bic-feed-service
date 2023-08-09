import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteSeriesCommand } from './delete-series.command';
import {
  ISeriesDomainService,
  SERIES_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';

@CommandHandler(DeleteSeriesCommand)
export class DeleteSeriesHandler implements ICommandHandler<DeleteSeriesCommand, void> {
  public constructor(
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN)
    private readonly _seriesDomainService: ISeriesDomainService
  ) {}

  public async execute(command: DeleteSeriesCommand): Promise<void> {
    await this._seriesDomainService.delete(command.payload);
  }
}
