import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteArticleCommand } from './delete-article.command';
import { IContentRepository, CONTENT_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { IContentValidator, CONTENT_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import { AccessDeniedException, ContentNotFoundException } from '../../../domain/exception';
import { ArticleEntity } from '../../../domain/model/content';
import { KAFKA_TOPIC, KafkaService } from '@app/kafka';
import { UserDto } from '../../../../v2-user/application';
import { ArticleChangedMessagePayload } from '../../dto/message';
import { TagDto } from '../../dto';

@CommandHandler(DeleteArticleCommand)
export class DeleteArticleHandler implements ICommandHandler<DeleteArticleCommand, void> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    private readonly _kafkaService: KafkaService
  ) {}

  public async execute(command: DeleteArticleCommand): Promise<void> {
    const { actor, id } = command.payload;

    const articleEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
      },
    });

    if (!articleEntity || !(articleEntity instanceof ArticleEntity)) {
      throw new ContentNotFoundException();
    }
    if (!articleEntity.isOwner(actor.id)) throw new AccessDeniedException();

    if (articleEntity.isPublished()) {
      await this._contentValidator.checkCanCRUDContent(
        actor,
        articleEntity.get('groupIds'),
        articleEntity.get('type')
      );
    }

    await this._contentRepository.delete(id);

    this._sendEvent(articleEntity, actor);
  }

  private _sendEvent(entity: ArticleEntity, actor: UserDto): void {
    if (entity.isPublished()) {
      const payload: ArticleChangedMessagePayload = {
        state: 'delete',
        before: {
          id: entity.get('id'),
          actor,
          type: entity.get('type'),
          setting: entity.get('setting'),
          groupIds: entity.get('groupIds'),
          seriesIds: entity.get('seriesIds'),
          tags: (entity.get('tags') || []).map((tag) => new TagDto(tag.toObject())),
          title: entity.get('title'),
          summary: entity.get('summary'),
          content: entity.get('content'),
          lang: entity.get('lang'),
          isHidden: entity.get('isHidden'),
          status: entity.get('status'),
          createdAt: entity.get('createdAt'),
          updatedAt: entity.get('updatedAt'),
          publishedAt: entity.get('publishedAt'),
        },
      };

      this._kafkaService.emit(KAFKA_TOPIC.CONTENT.ARTICLE_CHANGED, {
        key: entity.getId(),
        value: new ArticleChangedMessagePayload(payload),
      });
    }
  }
}
