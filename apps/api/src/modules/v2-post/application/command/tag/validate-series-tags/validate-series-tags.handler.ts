import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../../v2-group/application';
import {
  ITagDomainService,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../../domain/validator/interface';

import { ValidateSeriesTagsCommand } from './validate-series-tag.command';

@CommandHandler(ValidateSeriesTagsCommand)
export class ValidateSeriesTagsHandler implements ICommandHandler<ValidateSeriesTagsCommand, void> {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupApplicationService: IGroupApplicationService,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(TAG_DOMAIN_SERVICE_TOKEN) private readonly _tagDomainService: ITagDomainService
  ) {}

  public async execute(command: ValidateSeriesTagsCommand): Promise<void> {
    const { groupIds, tagIds, seriesIds } = command.payload;
    const groups = await this._groupApplicationService.findAllByIds(groupIds);
    const tags = await this._tagDomainService.findByIds(tagIds);

    return this._contentValidator.validateSeriesAndTags(groups, seriesIds, tags);
  }
}
