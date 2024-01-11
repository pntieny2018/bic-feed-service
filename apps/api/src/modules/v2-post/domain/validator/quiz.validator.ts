import { UserDto } from '@libs/service/user';
import { Inject, Injectable } from '@nestjs/common';

import { CONTENT_DOMAIN_SERVICE_TOKEN, IContentDomainService } from '../domain-service/interface';
import { ContentAccessDeniedException } from '../exception';

import { CONTENT_VALIDATOR_TOKEN, IContentValidator, IQuizValidator } from './interface';

@Injectable()
export class QuizValidator implements IQuizValidator {
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    protected readonly _contentDomainService: IContentDomainService,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    protected readonly _contentValidator: IContentValidator
  ) {}

  public async checkCanCUDQuizInContent(contentId: string, user: UserDto): Promise<void> {
    const contentEntity = await this._contentDomainService.getVisibleContent(contentId);
    if (!contentEntity.isOwner(user.id)) {
      throw new ContentAccessDeniedException();
    }
    await this._contentValidator.checkCanCRUDContent({
      user,
      groupIds: contentEntity.getGroupIds(),
      contentType: contentEntity.get('type'),
    });
  }
}
