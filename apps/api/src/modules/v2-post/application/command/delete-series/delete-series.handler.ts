import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteSeriesCommand } from './delete-series.command';
import { IContentRepository, CONTENT_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { IContentValidator, CONTENT_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import {
  ContentNoCRUDPermissionException,
  ContentNotFoundException,
} from '../../../domain/exception';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { SeriesEntity } from '../../../domain/model/content';

@CommandHandler(DeleteSeriesCommand)
export class DeleteSeriesHandler implements ICommandHandler<DeleteSeriesCommand, void> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    private readonly _eventEmitter: InternalEventEmitterService
  ) {}

  public async execute(command: DeleteSeriesCommand): Promise<void> {
    const { actor, id } = command.payload;

    const seriesEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
      },
    });

    if (!seriesEntity || !(seriesEntity instanceof SeriesEntity)) {
      throw new ContentNotFoundException();
    }
    if (!seriesEntity.isOwner(actor.id)) throw new ContentNoCRUDPermissionException();

    this._contentValidator.checkCanReadContent(seriesEntity, actor);

    await this._contentValidator.checkCanCRUDContent(
      actor,
      seriesEntity.get('groupIds'),
      seriesEntity.get('type')
    );

    await this._contentRepository.delete(seriesEntity.get('id'));
  }
}
