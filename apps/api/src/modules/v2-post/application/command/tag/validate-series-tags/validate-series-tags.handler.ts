import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
} from '../../../../domain/service-adapter-interface /group-adapter.interface';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../../domain/validator/interface';

import { ValidateSeriesTagsCommand } from './validate-series-tag.command';

@CommandHandler(ValidateSeriesTagsCommand)
export class ValidateSeriesTagsHandler implements ICommandHandler<ValidateSeriesTagsCommand, void> {
  public constructor(
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(TAG_DOMAIN_SERVICE_TOKEN) private readonly _tagDomainService: ITagDomainService
  ) {}

  public async execute(command: ValidateSeriesTagsCommand): Promise<void> {
    const { groupIds, tagIds, seriesIds } = command.payload;
    const groups = await this._groupAdapter.getGroupByIds(groupIds);
    const tags = await this._tagDomainService.findByIds(tagIds);

    return this._contentValidator.validateSeriesAndTags(groups, seriesIds, tags);
  }
}
