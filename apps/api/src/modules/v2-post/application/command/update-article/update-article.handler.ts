import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateArticleCommand } from './update-article.command';
import {
  GROUP_APPLICATION_TOKEN,
  GroupDto,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import {
  ArticleRequiredCoverException,
  ContentEmptyGroupException,
  ContentNoCRUDPermissionException,
  ContentNotFoundException,
} from '../../../domain/exception';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { ArticleEntity } from '../../../domain/model/content';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../binding/binding-post/content.interface';
import { cloneDeep } from 'lodash';
import { KafkaService } from '@app/kafka';

@CommandHandler(UpdateArticleCommand)
export class UpdateArticleHandler implements ICommandHandler<UpdateArticleCommand, void> {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    private readonly _kafkaService: KafkaService
  ) {}

  public async execute(command: UpdateArticleCommand): Promise<void> {
    const { actor, id, groupIds, coverMedia } = command.payload;

    const articleEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
      },
    });

    if (!articleEntity || !(articleEntity instanceof ArticleEntity)) {
      throw new ContentNotFoundException();
    }

    if (!articleEntity.isOwner(actor.id)) throw new ContentNoCRUDPermissionException();

    if (coverMedia && !coverMedia.id) throw new ArticleRequiredCoverException();

    if (groupIds && groupIds.length === 0) throw new ContentEmptyGroupException();

    const articleEntityBefore = cloneDeep(articleEntity);

    let groups: GroupDto[] = [];
    if (groupIds?.length) {
      groups = await this._groupAppService.findAllByIds(groupIds);
    }
  }
}
