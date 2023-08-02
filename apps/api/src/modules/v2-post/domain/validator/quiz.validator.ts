import { Inject, Injectable } from '@nestjs/common';
import {
  AUTHORITY_APP_SERVICE_TOKEN,
  IAuthorityAppService,
} from '../../../authority/application/authority.app-service.interface';
import { UserDto } from '../../../v2-user/application';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../../../v2-group/application';
import { IQuizValidator } from './interface/quiz.validator.interface';
import { CONTENT_DOMAIN_SERVICE_TOKEN, IContentDomainService } from '../domain-service/interface';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from './interface';
import { ContentAccessDeniedException } from '../exception';

@Injectable()
export class QuizValidator implements IQuizValidator {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    protected readonly _groupAppService: IGroupApplicationService,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected readonly _authorityAppService: IAuthorityAppService,
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
    await this._contentValidator.checkCanCRUDContent(
      user,
      contentEntity.getGroupIds(),
      contentEntity.get('type')
    );
  }
}
