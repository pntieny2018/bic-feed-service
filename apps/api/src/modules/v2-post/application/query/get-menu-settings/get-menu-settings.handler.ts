import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetMenuSettingsQuery } from './get-menu-settings.query';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../domain/domain-service/interface';
import { AUTHORITY_APP_SERVICE_TOKEN, IAuthorityAppService } from '../../../../authority';
import { MenuSettingsDto } from '../../dto';
import { ContentNotFoundException } from '../../../domain/exception';
import { PostType, QuizStatus } from '../../../data-type';
import {
  IReactionDomainService,
  REACTION_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/reaction.domain-service.interface';
import { ContentNotificationService } from '../../../../../notification/services';
import { isBoolean } from 'lodash';

@QueryHandler(GetMenuSettingsQuery)
export class GetMenuSettingsHandler
  implements IQueryHandler<GetMenuSettingsQuery, MenuSettingsDto>
{
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected readonly _authorityAppService: IAuthorityAppService,
    @Inject(REACTION_DOMAIN_SERVICE_TOKEN)
    private readonly _reactionDomainService: IReactionDomainService,
    private readonly _contentNotificationService: ContentNotificationService
  ) {}

  public async execute(query: GetMenuSettingsQuery): Promise<MenuSettingsDto> {
    const { id, authUser } = query.payload;

    const contentEnity = await this._contentDomainService.getContentToBuildMenuSettings(id);

    if (!contentEnity) {
      throw new ContentNotFoundException();
    }

    const reactionsCount = await this._reactionDomainService.getAndCountReactionByContents([
      contentEnity.getId(),
    ]);

    const groupdIds = contentEnity.getGroupIds();
    const contentId = contentEnity.getId();
    const specificNotifications =
      await this._contentNotificationService.getSpecificNotificationSettings(
        authUser.id,
        contentId
      );

    this._authorityAppService.buildAbility(authUser);
    const canCRUDPostArticle = this._authorityAppService.canCRUDPostArticle(groupdIds);

    const menuSetting: MenuSettingsDto = {
      edit: contentEnity.isOwner(authUser.id) && canCRUDPostArticle,
      editSetting: this._authorityAppService.canEditSetting(groupdIds),
      saveOrUnsave: true,
      copyLink: true,
      viewReactions: (reactionsCount.get(contentId) || []).length > 0,
      viewSeries: contentEnity.getType() !== PostType.SERIES,
      pinContent: this._authorityAppService.canPinContent(groupdIds),
      createQuiz:
        contentEnity.getType() !== PostType.SERIES &&
        contentEnity.isOwner(authUser.id) &&
        canCRUDPostArticle &&
        !contentEnity.hasQuiz(),
      deleteQuiz:
        contentEnity.getType() !== PostType.SERIES &&
        contentEnity.isOwner(authUser.id) &&
        canCRUDPostArticle &&
        contentEnity.hasQuiz(),
      editQuiz:
        contentEnity.getType() !== PostType.SERIES &&
        contentEnity.isOwner(authUser.id) &&
        canCRUDPostArticle &&
        contentEnity.hasQuiz() &&
        contentEnity.getQuiz().get('status') === QuizStatus.PUBLISHED,
      delete: contentEnity.isOwner(authUser.id) && canCRUDPostArticle,
      reportContent:
        contentEnity.getType() !== PostType.SERIES && !contentEnity.isOwner(authUser.id),
      reportMember: !contentEnity.isOwner(authUser.id),
      enableSpecificNotifications: isBoolean(specificNotifications?.enable)
        ? specificNotifications.enable
        : true,
    };

    return new MenuSettingsDto(menuSetting);
  }
}
