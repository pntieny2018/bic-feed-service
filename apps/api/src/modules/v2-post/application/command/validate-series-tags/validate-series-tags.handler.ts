import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  ITagRepository,
  TAG_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../domain/validator/interface';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import { ValidateSeriesTagsCommand } from './validate-series-tag.command';

@CommandHandler(ValidateSeriesTagsCommand)
export class ValidateSeriesTagsHandler implements ICommandHandler<ValidateSeriesTagsCommand, void> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupApplicationService: IGroupApplicationService,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding,
    @Inject(TAG_REPOSITORY_TOKEN) private readonly _tagRepo: ITagRepository
  ) {}

  public async execute(command: ValidateSeriesTagsCommand): Promise<void> {
    const { groupIds, tagIds, seriesIds } = command.payload;
    const groups = await this._groupApplicationService.findAllByIds(groupIds);
    const tags = await this._tagRepo.findAll({
      ids: tagIds,
    });
    await this._contentValidator.validateSeriesAndTags(groups, seriesIds, tags);
  }
}
