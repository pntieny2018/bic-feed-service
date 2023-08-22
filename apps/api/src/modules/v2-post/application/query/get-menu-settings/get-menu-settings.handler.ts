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
    private readonly _reactionDomainService: IReactionDomainService
  ) {}

  public async execute(query: GetMenuSettingsQuery): Promise<MenuSettingsDto> {
    const { id, authUser } = query.payload;

    const contentEnity = await this._contentDomainService.getContentToBuildMenuSettings(
      id,
      authUser.id
    );

    if (!contentEnity) {
      throw new ContentNotFoundException();
    }

    const reactionsCount = await this._reactionDomainService.getAndCountReactionByContents([
      contentEnity.getId(),
    ]);

    this._authorityAppService.buildAbility(authUser);
    const canCRUDPostArticle = this._authorityAppService.canCRUDPostArticle(
      contentEnity.getGroupIds()
    );

    const menuSetting: MenuSettingsDto = {
      edit: contentEnity.isOwner(authUser.id) && canCRUDPostArticle,
      editSetting: this._authorityAppService.canEditSetting(contentEnity.getGroupIds()),
      save: !contentEnity.isSaved(),
      unSave: contentEnity.isSaved(),
      copyLink: true,
      viewReactions: (reactionsCount.get(contentEnity.getId()) || []).length > 0,
      viewSeries: contentEnity.getType() !== PostType.SERIES,
      pinContent: this._authorityAppService.canPinContent(contentEnity.getGroupIds()),
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
    };

    return new MenuSettingsDto(menuSetting);
  }
}
