import { Inject } from '@nestjs/common';
import { QuizStatus } from '../../../data-type';
import { ArticleDto, PostDto, SeriesDto } from '../../dto';
import { FindDraftQuizzesDto } from './find-draft-quizzes.dto';
import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';
import { FindDraftQuizzesQuery } from './find-draft-quizzes.query';
import { FindPostsByIdsQuery } from '../find-posts-by-ids/find-posts-by-ids.query';
import { IQuizRepository, QUIZ_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';

@QueryHandler(FindDraftQuizzesQuery)
export class FindDraftQuizzesHandler
  implements IQueryHandler<FindDraftQuizzesQuery, FindDraftQuizzesDto>
{
  public constructor(
    private readonly _queryBus: QueryBus,
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _quizRepository: IQuizRepository
  ) {}

  public async execute(query: FindDraftQuizzesQuery): Promise<FindDraftQuizzesDto> {
    const { authUser } = query.payload;

    const { rows, meta } = await this._quizRepository.getPagination({
      ...query.payload,
      where: {
        createdBy: authUser.id,
        status: QuizStatus.DRAFT,
      },
      attributes: ['id', 'contentId', 'createdAt'],
    });

    if (!rows || rows.length === 0) return new FindDraftQuizzesDto([], meta);

    const contentIds = rows.map((row) => row.get('contentId'));

    const contents = await this._queryBus.execute<
      FindPostsByIdsQuery,
      (PostDto | ArticleDto | SeriesDto)[]
    >(
      new FindPostsByIdsQuery({
        ids: contentIds,
        authUser,
      })
    );

    return new FindDraftQuizzesDto(contents, meta);
  }
}
