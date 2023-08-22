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
import { ContentEntity } from '../../../domain/model/content';

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

    this._authorityAppService.buildAbility(authUser);

    const userId = authUser.id;
    const groupdIds = contentEnity.getGroupIds();
    const canCRUDContent = this._canCURDContent(contentEnity, userId);
    const canReportContent = this._canReportContent(contentEnity, userId);
    const { canCreateQuiz, canDeleteQuiz, canEditQuiz } = this._canCURDQuiz(
      contentEnity,
      canCRUDContent
    );
    const canViewReaction = await this._canViewReaction(contentEnity);
    const isEnableSpecificNotifications = await this._isEnableSpecificNotifications(
      contentEnity,
      userId
    );

    const menuSetting: MenuSettingsDto = {
      edit: canCRUDContent,
      editSetting: this._authorityAppService.canEditSetting(groupdIds),
      saveOrUnsave: true,
      copyLink: true,
      viewReactions: canViewReaction,
      viewSeries: contentEnity.getType() !== PostType.SERIES,
      pinContent: this._authorityAppService.canPinContent(groupdIds),
      createQuiz: canCreateQuiz,
      deleteQuiz: canDeleteQuiz,
      editQuiz: canEditQuiz,
      delete: canCRUDContent,
      reportContent: canReportContent,
      reportMember: !contentEnity.isOwner(userId),
      enableSpecificNotifications: isEnableSpecificNotifications,
    };

    return new MenuSettingsDto(menuSetting);
  }

  private _canCURDQuiz(
    contentEnity: ContentEntity,
    canCRUDContent: boolean
  ): { canCreateQuiz: boolean; canDeleteQuiz: boolean; canEditQuiz: boolean } {
    return {
      canCreateQuiz:
        contentEnity.getType() !== PostType.SERIES && canCRUDContent && !contentEnity.hasQuiz(),
      canDeleteQuiz:
        contentEnity.getType() !== PostType.SERIES && canCRUDContent && contentEnity.hasQuiz(),
      canEditQuiz:
        contentEnity.getType() !== PostType.SERIES &&
        canCRUDContent &&
        contentEnity.hasQuiz() &&
        contentEnity.getQuiz().get('status') === QuizStatus.PUBLISHED,
    };
  }

  private _canCURDContent(contentEnity: ContentEntity, userId: string): boolean {
    const groupIds = contentEnity.getGroupIds();
    if (contentEnity.getType() === PostType.SERIES) {
      const canCRUDSeries = this._authorityAppService.canCRUDSeries(groupIds);
      return contentEnity.isOwner(userId) && canCRUDSeries;
    }
    const canCRUDPostArticle = this._authorityAppService.canCRUDPostArticle(groupIds);
    return contentEnity.isOwner(userId) && canCRUDPostArticle;
  }

  private _canReportContent(contentEnity: ContentEntity, userId: string): boolean {
    return contentEnity.getType() !== PostType.SERIES && !contentEnity.isOwner(userId);
  }

  private async _isEnableSpecificNotifications(
    contentEnity: ContentEntity,
    userId: string
  ): Promise<boolean> {
    const specificNotifications =
      await this._contentNotificationService.getSpecificNotificationSettings(
        userId,
        contentEnity.getId()
      );

    return isBoolean(specificNotifications?.enable) ? specificNotifications.enable : true;
  }

  private async _canViewReaction(contentEnity: ContentEntity): Promise<boolean> {
    const reactionsCount = await this._reactionDomainService.getAndCountReactionByContents([
      contentEnity.getId(),
    ]);

    return (reactionsCount.get(contentEnity.getId()) || []).length > 0;
  }
}
