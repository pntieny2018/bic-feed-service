import { Inject } from '@nestjs/common';
import { ArticleEntity, PostEntity, SeriesEntity } from '../../../domain/model/content';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindDraftQuizzesDto } from './find-draft-quizzes.dto';
import { FindDraftQuizzesQuery } from './find-draft-quizzes.query';
import { IQuizQuery, QUIZ_QUERY_TOKEN } from '../../../domain/query-interface';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../binding/binding-post/content.interface';
import { QuizDto } from '../../dto';

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

    const quizzesMapper = new Map<string, QuizDto>();
    const content: (PostEntity | SeriesEntity | ArticleEntity)[] = [];

    rows.forEach((row) => {
      quizzesMapper.set(
        row.get('contentId'),
        new QuizDto({
          id: row.get('id'),
          title: row.get('title'),
          description: row.get('description'),
          status: row.get('status'),
          genStatus: row.get('genStatus'),
          createdAt: row.get('createdAt'),
          updatedAt: row.get('updatedAt'),
        })
      );
      content.push(row.get('content'));
    });

    const contentBinding = await this._contentBinding.contentsBinding(content, authUser);

    const result = contentBinding.map((content) => {
      return {
        ...content,
        quiz: quizzesMapper.get(content.id),
      };
    });

    return new FindDraftQuizzesDto(result, meta);
  }
}
