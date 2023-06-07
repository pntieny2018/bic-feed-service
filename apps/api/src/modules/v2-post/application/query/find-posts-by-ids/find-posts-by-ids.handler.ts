import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ArticleDto, PostDto, SeriesDto } from '../../dto';
import { FindPostsByIdsQuery } from './find-posts-by-ids.query';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { PostEntity, SeriesEntity } from '../../../domain/model/content';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import { ArticleEntity } from '../../../domain/model/content/article.entity';

@QueryHandler(FindPostsByIdsQuery)
export class FindPostsByIdsHandler
  implements IQueryHandler<FindPostsByIdsQuery, (PostDto | ArticleDto | SeriesDto)[]>
{
  @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepo: IContentRepository;
  @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding;

  public async execute(query: FindPostsByIdsQuery): Promise<(PostDto | ArticleDto | SeriesDto)[]> {
    const { ids, authUser } = query.payload;
    const contentEntities = await this._contentRepo.findAll({
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
    const contentsSorted = this._sortContentsByIds(ids, contentEntities);
    const result = await this._contentBinding.contentsBinding(contentsSorted, authUser);
    return result;
  }

  private _sortContentsByIds(
    ids: string[],
    contents: (PostEntity | ArticleEntity | SeriesEntity)[]
  ): (PostEntity | ArticleEntity | SeriesEntity)[] {
    const contentsSorted = [];
    for (const id of ids) {
      const content = contents.find((item) => item.getId() === id);
      if (content) {
        contentsSorted.push(content);
      }
    }
    return contentsSorted;
  }
}
