import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindDraftQuizzesDto } from './find-draft-quizzes.dto';
import { FindDraftQuizzesQuery } from './find-draft-quizzes.query';
import { IQuizQuery, QUIZ_QUERY_TOKEN } from '../../../domain/query-interface';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../binding/binding-post/content.interface';
import { QuizStatus } from '../../../data-type';

@QueryHandler(FindDraftQuizzesQuery)
export class FindDraftQuizzesHandler
  implements IQueryHandler<FindDraftQuizzesQuery, FindDraftQuizzesDto>
{
  public constructor(
    @Inject(QUIZ_QUERY_TOKEN)
    private readonly _quizQuery: IQuizQuery,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding
  ) {}

  public async execute(query: FindDraftQuizzesQuery): Promise<FindDraftQuizzesDto> {
    const { authUser } = query.payload;

    const { rows, meta } = await this._quizQuery.getDraft({
      ...query.payload,
      where: {
        createdBy: authUser.id,
        status: QuizStatus.DRAFT,
      },
    });

    if (!rows || rows.length === 0) return new FindDraftQuizzesDto([], meta);

    const result = await this._contentBinding.contentsBinding(rows, authUser);

    return new FindDraftQuizzesDto(result, meta);
  }
}
