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

    const contentEntity = await this._contentDomainService.getContentToBuildMenuSettings(id);

    if (!contentEntity) {
      throw new ContentNotFoundException();
    }

    this._authorityAppService.buildAbility(authUser);

    const userId = authUser.id;
    const groupdIds = contentEntity.getGroupIds();
    const canCRUDContent = this._canCURDContent(contentEntity, userId);
    const canReportContent = this._canReportContent(contentEntity, userId);
    const { canCreateQuiz, canDeleteQuiz, canEditQuiz } = this._canCURDQuiz(
      contentEntity,
      canCRUDContent
    );
    const canViewReaction = await this._canViewReaction(contentEntity);
    const isEnableSpecificNotifications = await this._isEnableSpecificNotifications(
      contentEntity,
      userId
    );

    const menuSetting: MenuSettingsDto = {
      edit: canCRUDContent,
      editSetting: this._authorityAppService.canEditSetting(groupdIds),
      saveOrUnsave: true,
      copyLink: true,
      viewReactions: canViewReaction,
      viewSeries: contentEntity.getType() !== PostType.SERIES,
      pinContent: this._authorityAppService.canPinContent(groupdIds),
      createQuiz: canCreateQuiz,
      deleteQuiz: canDeleteQuiz,
      editQuiz: canEditQuiz,
      delete: canCRUDContent,
      reportContent: canReportContent,
      reportMember: !contentEntity.isOwner(userId),
      enableSpecificNotifications: isEnableSpecificNotifications,
    };

    return new MenuSettingsDto(menuSetting);
  }

  private _canCURDQuiz(
    contentEntity: ContentEntity,
    canCRUDContent: boolean
  ): { canCreateQuiz: boolean; canDeleteQuiz: boolean; canEditQuiz: boolean } {
    return {
      canCreateQuiz:
        contentEntity.getType() !== PostType.SERIES && canCRUDContent && !contentEntity.hasQuiz(),
      canDeleteQuiz:
        contentEntity.getType() !== PostType.SERIES && canCRUDContent && contentEntity.hasQuiz(),
      canEditQuiz:
        contentEntity.getType() !== PostType.SERIES &&
        canCRUDContent &&
        contentEntity.hasQuiz() &&
        contentEntity.getQuiz().get('status') === QuizStatus.PUBLISHED,
    };
  }

  private _canCURDContent(contentEntity: ContentEntity, userId: string): boolean {
    const groupIds = contentEntity.getGroupIds();
    if (contentEntity.getType() === PostType.SERIES) {
      const canCRUDSeries = this._authorityAppService.canCRUDSeries(groupIds);
      return contentEntity.isOwner(userId) && canCRUDSeries;
    }
    const canCRUDPostArticle = this._authorityAppService.canCRUDPostArticle(groupIds);
    return contentEntity.isOwner(userId) && canCRUDPostArticle;
  }

  private _canReportContent(contentEntity: ContentEntity, userId: string): boolean {
    return contentEntity.getType() !== PostType.SERIES && !contentEntity.isOwner(userId);
  }

  private async _isEnableSpecificNotifications(
    contentEntity: ContentEntity,
    userId: string
  ): Promise<boolean> {
    const specificNotifications =
      await this._contentNotificationService.getSpecificNotificationSettings(
        userId,
        contentEntity.getId()
      );

    return isBoolean(specificNotifications?.enable) ? specificNotifications.enable : true;
  }

  private async _canViewReaction(contentEntity: ContentEntity): Promise<boolean> {
    const reactionsCount = await this._reactionDomainService.getAndCountReactionByContents([
      contentEntity.getId(),
    ]);

    return (reactionsCount.get(contentEntity.getId()) || []).length > 0;
  }
}
