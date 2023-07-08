import { Inject } from '@nestjs/common';
import { isEmpty } from 'class-validator';
import { PostStatus } from '../../../data-type';
import { ArticleDto, PostDto, SeriesDto } from '../../dto';
import { FindDraftContentsDto } from './find-draft-contents.dto';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { FindDraftContentsQuery } from './find-draft-contents.query';
import { FindPostsByIdsQuery } from '../find-posts-by-ids/find-posts-by-ids.query';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';

@QueryHandler(FindDraftContentsQuery)
export class FindDraftContentsHandler
  implements IQueryHandler<FindDraftContentsQuery, FindDraftContentsDto>
{
  public constructor(
    private readonly _queryBus: QueryBus,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async execute(query: FindDraftContentsQuery): Promise<FindDraftContentsDto> {
    const { authUser, type, isProcessing } = query.payload;

    const { rows, meta } = await this._contentRepository.getPagination({
      ...query.payload,
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

    if (!rows || rows.length === 0) return new FindDraftContentsDto([], meta);

    const contentIds = rows.map((row) => row.getId());

    const contents = await this._queryBus.execute<
      FindPostsByIdsQuery,
      (PostDto | ArticleDto | SeriesDto)[]
    >(
      new FindPostsByIdsQuery({
        ids: contentIds,
        authUser,
      })
    );

    return new FindDraftContentsDto(contents, meta);
  }
}
