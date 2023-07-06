import { Inject } from '@nestjs/common';
import { QuizEntity } from '../../../domain/model/quiz';
import { ArticleEntity, PostEntity, SeriesEntity } from '../../../domain/model/content';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindDraftQuizzesDto } from './find-draft-quizzes.dto';
import { FindDraftQuizzesQuery } from './find-draft-quizzes.query';
import { IQuizQuery, QUIZ_QUERY_TOKEN } from '../../../domain/query-interface';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../binding/binding-post/content.interface';

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
      authUserId: authUser.id,
    });

    if (!rows || rows.length === 0) return new FindDraftQuizzesDto([], meta);

    const contents: (PostEntity | SeriesEntity | ArticleEntity)[] = [];

    rows.forEach((row) => {
      const content = row.get('content');
      const draftQuiz = new QuizEntity({
        id: row.get('id'),
        title: row.get('title'),
        contentId: row.get('contentId'),
        description: row.get('description'),
        status: row.get('status'),
        genStatus: row.get('genStatus'),
        createdAt: row.get('createdAt'),
        updatedAt: row.get('updatedAt'),
      });
      content.setQuiz(draftQuiz);
      contents.push(content);
    });

    const contentBinding = await this._contentBinding.contentsBinding(contents, authUser);

    return new FindDraftQuizzesDto(contentBinding, meta);
  }
}
