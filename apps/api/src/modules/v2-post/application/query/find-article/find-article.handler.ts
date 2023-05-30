import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { ArticleDto, PostDto } from '../../dto';
import { FindArticleQuery } from './find-article.query';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../../v2-user/application';
import { ContentNotFoundException } from '../../../domain/exception';
import { PostEntity } from '../../../domain/model/content';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import { AccessDeniedException } from '../../../domain/exception/access-denied.exception';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import { SeriesEntity } from '../../../domain/model/content/series.entity';
import {
  IReactionQuery,
  REACTION_QUERY_TOKEN,
} from '../../../domain/query-interface/reaction.query.interface';
import { ArticleEntity } from '../../../domain/model/content/article.entity';

@QueryHandler(FindArticleQuery)
export class FindArticleHandler implements IQueryHandler<FindArticleQuery, ArticleDto> {
  @Inject(GROUP_APPLICATION_TOKEN) private readonly _groupAppService: IGroupApplicationService;
  @Inject(USER_APPLICATION_TOKEN) private readonly _userAppService: IUserApplicationService;
  @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepo: IContentRepository;
  @Inject(POST_VALIDATOR_TOKEN) private readonly _postValidator: IPostValidator;
  @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding;
  @Inject(REACTION_QUERY_TOKEN) private readonly _reactionQuery: IReactionQuery;

  public async execute(query: FindArticleQuery): Promise<ArticleDto> {
    const { articleId, authUser } = query.payload;
    const articleEntity = await this._contentRepo.findOne({
      where: {
        id: articleId,
        groupArchived: false,
        excludeReportedByUserId: authUser.id,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
        shouldIncludeTag: true,
        shouldIncludeLinkPreview: true,
        shouldIncludeSavedUserId: authUser?.id,
        shouldIncludeMarkReadImportantUserId: authUser?.id,
        shouldIncludeReactionUserId: authUser?.id,
      },
    });

    if (
      (articleEntity.isDraft() && !articleEntity.isOwner(authUser.id)) ||
      articleEntity.isHidden() ||
      !articleEntity ||
      !(articleEntity instanceof ArticleEntity)
    ) {
      throw new ContentNotFoundException();
    }

    if (!authUser && !articleEntity.isOpen()) {
      throw new AccessDeniedException();
    }
    const groups = await this._groupAppService.findAllByIds(articleEntity.get('groupIds'));
    if (authUser) {
      await this._postValidator.checkCanReadContent(articleEntity, authUser, groups);
    }

    let series;
    if (articleEntity.get('seriesIds')?.length) {
      series = await this._contentRepo.findAll({
        attributes: ['id', 'title'],
        where: {
          groupArchived: false,
          ids: articleEntity.get('seriesIds'),
        },
        include: {
          mustIncludeGroup: true,
        },
      });
    }

    const reactionsCount = await this._reactionQuery.getAndCountReactionByContents([
      series.getId(),
    ]);

    return this._contentBinding.articleBinding(articleEntity, {
      groups,
      actor: new UserDto(authUser),
      series: series as SeriesEntity[],
      reactionsCount,
    });
  }
}
