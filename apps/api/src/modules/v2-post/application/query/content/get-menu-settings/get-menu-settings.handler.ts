import { CONTENT_TYPE, QUIZ_STATUS } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { isBoolean } from 'lodash';

import { ContentNotificationService } from '../../../../../../notification/services';
import { AUTHORITY_APP_SERVICE_TOKEN, IAuthorityAppService } from '../../../../../authority';
import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
  IReactionDomainService,
  REACTION_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ContentNotFoundException } from '../../../../domain/exception';
import { ContentEntity } from '../../../../domain/model/content';
import { MenuSettingsDto } from '../../../dto';

import { GetMenuSettingsQuery } from './get-menu-settings.query';

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
    const userId = authUser.id;

    const contentEntity = await this._contentDomainService.getContentToBuildMenuSettings(
      id,
      userId
    );

    if (!contentEntity) {
      throw new ContentNotFoundException();
    }

    await this._authorityAppService.buildAbility(authUser);

    const groupIds = contentEntity.getGroupIds();
    const canCRUDContent = this._canCURDContent(contentEntity, userId);

    if (contentEntity.isWaitingSchedule() || contentEntity.isScheduleFailed()) {
      return new MenuSettingsDto({
        canEdit: canCRUDContent,
        canCopyLink: true,
        canViewSeries: contentEntity.getType() !== CONTENT_TYPE.SERIES,
        canDelete: canCRUDContent,
      });
    }

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
      canEdit: canCRUDContent,
      canEditSetting: this._authorityAppService.canEditSetting(groupIds),
      isSave: contentEntity.isSaved(),
      canCopyLink: true,
      canViewReactions: canViewReaction,
      canViewSeries: contentEntity.getType() !== CONTENT_TYPE.SERIES,
      canPinContent: this._authorityAppService.canPinContent(groupIds),
      canCreateQuiz,
      canDeleteQuiz,
      canEditQuiz,
      canDelete: canCRUDContent,
      canReportContent,
      canReportMember: !contentEntity.isOwner(userId),
      isEnableNotifications: isEnableSpecificNotifications,
    };

    return new MenuSettingsDto(menuSetting);
  }

  private _canCURDQuiz(
    contentEntity: ContentEntity,
    canCRUDContent: boolean
  ): { canCreateQuiz: boolean; canDeleteQuiz: boolean; canEditQuiz: boolean } {
    return {
      canCreateQuiz:
        contentEntity.getType() !== CONTENT_TYPE.SERIES &&
        canCRUDContent &&
        !contentEntity.hasQuiz(),
      canDeleteQuiz:
        contentEntity.getType() !== CONTENT_TYPE.SERIES &&
        canCRUDContent &&
        contentEntity.hasQuiz(),
      canEditQuiz:
        contentEntity.getType() !== CONTENT_TYPE.SERIES &&
        canCRUDContent &&
        contentEntity.hasQuiz() &&
        contentEntity.getQuiz().get('status') === QUIZ_STATUS.PUBLISHED,
    };
  }

  private _canCURDContent(contentEntity: ContentEntity, userId: string): boolean {
    const groupIds = contentEntity.getGroupIds();
    if (contentEntity.getType() === CONTENT_TYPE.SERIES) {
      const canCRUDSeries = this._authorityAppService.canCRUDSeries(groupIds);
      return contentEntity.isOwner(userId) && canCRUDSeries;
    }
    const canCRUDPostArticle = this._authorityAppService.canCRUDPostArticle(groupIds);
    return contentEntity.isOwner(userId) && canCRUDPostArticle;
  }

  private _canReportContent(contentEntity: ContentEntity, userId: string): boolean {
    return contentEntity.getType() !== CONTENT_TYPE.SERIES && !contentEntity.isOwner(userId);
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
    const reactionsCount = await this._reactionDomainService.getAndCountReactionByContentIds([
      contentEntity.getId(),
    ]);

    return (reactionsCount.get(contentEntity.getId()) || []).length > 0;
  }
}
