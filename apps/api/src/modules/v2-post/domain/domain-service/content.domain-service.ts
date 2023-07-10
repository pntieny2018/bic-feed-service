import { Inject } from '@nestjs/common';
import { isEmpty } from 'class-validator';
import { PostStatus } from '../../data-type';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';
import {
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

  public getDrafts(
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
}
