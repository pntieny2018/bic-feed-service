import { Inject } from '@nestjs/common';
import { IQuizQuery, QueryQuizOptions } from '../../domain/query-interface';
import { ArticleEntity, PostEntity, SeriesEntity } from '../../domain/model/content';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../domain/repositoty-interface';
import { FindOptions, WhereOptions } from 'sequelize';
import { IQuiz } from 'apps/api/src/database/models/quiz.model';
import { PostModel } from 'apps/api/src/database/models/post.model';
import { isBoolean } from 'lodash';
import { PostGroupModel } from 'apps/api/src/database/models/post-group.model';

export class QuizQuery implements IQuizQuery {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async getDraft(
    input: QueryQuizOptions
  ): Promise<CursorPaginationResult<ArticleEntity | PostEntity | SeriesEntity>> {
    const { after, before, limit, order } = input;
    return;
  }

  private _buildQueryOptions(options: QueryQuizOptions): FindOptions<IQuiz> {
    const findOption: FindOptions<IQuiz> = {};
    findOption.where = this._getCondition(options);
    const includeAttr = [];
    if (options.include) {
      const { includePost, includeGroup } = options.include;
      if (includePost) {
        includeAttr.push({
          model: PostModel,
          as: 'post',
          required: includePost.required,
          where: {
            ...(includePost.createdBy && {
              createdBy: includePost.createdBy,
            }),
            ...(isBoolean(includePost.isHidden) && {
              isHidden: includePost.isHidden,
            }),
            ...(includePost.status && {
              status: includePost.status,
            }),
          },
          ...(includeGroup && {
            include: [
              {
                model: PostGroupModel,
                as: 'groups',
                required: includeGroup.required,
                where: {
                  ...(isBoolean(includeGroup.groupArchived) && {
                    groupArchived: includeGroup.groupArchived,
                  }),
                },
              },
            ],
          }),
        });
      }
    }
    if (includeAttr.length) findOption.include = includeAttr;
    return findOption;
  }

  private _getCondition(options: QueryQuizOptions): WhereOptions<IQuiz> {
    const { createdBy, status } = options.where;
    const where: WhereOptions<IQuiz> = {};

    if (createdBy) where['createdBy'] = createdBy;

    if (status) where['status'] = status;

    return where;
  }
}
