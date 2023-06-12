import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteArticleCommand } from './delete-article.command';
import { IContentRepository, CONTENT_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { IContentValidator, CONTENT_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import {
  ContentNoCRUDPermissionException,
  ContentNotFoundException,
} from '../../../domain/exception';
import { ArticleEntity } from '../../../domain/model/content';
import { KafkaService } from '@app/kafka';
import { UserDto } from '../../../../v2-user/application';

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
        mustIncludeGroup: true,
      },
    });

    if (!articleEntity || !(articleEntity instanceof ArticleEntity)) {
      throw new ContentNotFoundException();
    }
    if (!articleEntity.isOwner(actor.id)) throw new ContentNoCRUDPermissionException();

    this._contentValidator.checkCanReadContent(articleEntity, actor);

    await this._contentValidator.checkCanCRUDContent(
      actor,
      articleEntity.get('groupIds'),
      articleEntity.get('type')
    );

    await this._contentRepository.delete(articleEntity.get('id'));
  }
}
