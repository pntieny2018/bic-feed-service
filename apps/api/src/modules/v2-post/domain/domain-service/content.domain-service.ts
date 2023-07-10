import { Inject } from '@nestjs/common';
import { isEmpty } from 'class-validator';
import { PostStatus } from '../../data-type';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';
import {
  GetContentByIdsProps,
  GetDraftsProps,
  IContentDomainService,
} from './interface/content.domain-service.interface';
import { ArticleEntity, PostEntity, SeriesEntity } from '../model/content';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';

export class ContentDomainService implements IContentDomainService {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async getDrafts(
    input: GetDraftsProps
  ): Promise<CursorPaginationResult<PostEntity | ArticleEntity | SeriesEntity>> {
    const { authUser, isProcessing, type } = input;
    return this._contentRepository.getPagination({
      ...input,
      where: {
        createdBy: authUser.id,
        status: PostStatus.DRAFT,
        ...(isProcessing && {
          status: PostStatus.PROCESSING,
        }),
        ...(!isEmpty(type) && {
          type,
        }),
      },
      attributes: {
        exclude: ['content'],
      },
    });
  }

  public async getContentByIds(
    input: GetContentByIdsProps
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]> {
    const { ids, authUser } = input;
    const contentEntities = await this._contentRepository.findAll({
      where: {
        ids,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeItems: true,
        shouldIncludeLinkPreview: true,
        shouldIncludeSaved: {
          userId: authUser?.id,
        },
        shouldIncludeMarkReadImportant: {
          userId: authUser?.id,
        },
        shouldIncludeReaction: {
          userId: authUser?.id,
        },
      },
    });

    return contentEntities.sort((a, b) => ids.indexOf(a.getId()) - ids.indexOf(b.getId()));
  }
}
