import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteSeriesCommand } from './delete-series.command';
import { IContentRepository, CONTENT_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { IContentValidator, CONTENT_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import {
  ContentNoCRUDPermissionException,
  ContentNotFoundException,
} from '../../../domain/exception';
import { SeriesEntity } from '../../../domain/model/content';
import { KAFKA_TOPIC, KafkaService } from '@app/kafka';
import { SeriesChangedMessagePayload } from '../../dto/message/series-changed.message-payload';
import { UserDto } from '../../../../v2-user/application';

@CommandHandler(DeleteSeriesCommand)
export class DeleteSeriesHandler implements ICommandHandler<DeleteSeriesCommand, void> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    private readonly _kafkaService: KafkaService
  ) {}

  public async execute(command: DeleteSeriesCommand): Promise<void> {
    const { actor, id } = command.payload;

    const seriesEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        mustIncludeGroup: true,
        shouldIncludeItems: true,
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

    this._sendEvent(seriesEntity, actor);
  }

  private _sendEvent(entity: SeriesEntity, actor: UserDto): void {
    if (entity.isPublished()) {
      const payload: SeriesChangedMessagePayload = {
        state: 'delete',
        before: {
          id: entity.get('id'),
          actor,
          type: entity.get('type'),
          groupIds: entity.get('groupIds'),
          itemIds: entity.get('itemIds'),
          title: entity.get('title'),
          summary: entity.get('summary'),
          lang: entity.get('lang'),
          isHidden: entity.get('isHidden'),
          status: entity.get('status'),
          createdAt: entity.get('createdAt'),
          updatedAt: entity.get('updatedAt'),
        },
      };

      this._kafkaService.emit(KAFKA_TOPIC.CONTENT.SERIES_CHANGED, {
        key: entity.getId(),
        value: new SeriesChangedMessagePayload(payload),
      });
    }
  }
}
