import { Inject } from '@nestjs/common';
import {
  FindAllQuizProps,
  IQuizRepository,
  QUIZ_REPOSITORY_TOKEN,
} from '../../domain/repositoty-interface';
import { QuizEntity } from '../../domain/model/quiz';
import { PostStatus, QuizStatus } from '../../data-type';
import { IQuizQuery, QueryQuizOptions } from '../../domain/query-interface';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';

export class QuizQuery implements IQuizQuery {
  public constructor(
    @Inject(QUIZ_REPOSITORY_TOKEN)
    private readonly _contentRepository: IQuizRepository
  ) {}

  public async getDraft(input: QueryQuizOptions): Promise<CursorPaginationResult<QuizEntity>> {
    const { authUserId } = input;

    const queryOptions: FindAllQuizProps = {
      where: {
        createdBy: authUserId,
        status: QuizStatus.DRAFT,
      },
      include: {
        includePost: {
          required: true,
          status: PostStatus.PUBLISHED,
          isHidden: false,
        },
        includeGroup: {
          required: false,
          groupArchived: false,
        },
      },
      attributes: [
        'id',
        'contentId',
        'title',
        'description',
        'status',
        'genStatus',
        'createdAt',
        'updatedAt',
      ],
    };

    return this._contentRepository.getPagination({ ...queryOptions, ...input });
  }
}
