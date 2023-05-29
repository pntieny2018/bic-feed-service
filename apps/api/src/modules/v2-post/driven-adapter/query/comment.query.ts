import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions, Op, Sequelize, WhereAttributeHash } from 'sequelize';
import { CommentModel, IComment } from '../../../../database/models/comment.model';
import { ReportContentDetailModel } from '../../../../database/models/report-content-detail.model';
import { COMMENT_FACTORY_TOKEN, ICommentFactory } from '../../domain/factory/interface';
import { GetPaginationCommentProps, ICommentQuery } from '../../domain/query-interface';
import { CommentEntity } from '../../domain/model/comment';
import { TargetType } from '../../../report-content/contstants';
import { paginate } from '../../../../common/dto/cusor-pagination';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';

export class CommentQuery implements ICommentQuery {
  public constructor(
    @Inject(COMMENT_FACTORY_TOKEN)
    private readonly _factory: ICommentFactory,
    @InjectModel(CommentModel)
    private readonly _commentModel: typeof CommentModel
  ) {}

  public async getPagination(
    input: GetPaginationCommentProps
  ): Promise<CursorPaginationResult<CommentEntity>> {
    const { limit, order, postId, parentId, previousCursor, nextCursor } = input;
    const restQueryOptions = this._getRestCondition(input);
    const findOptions: FindOptions = {
      where: {
        postId: postId,
        parentId: parentId,
        isHidden: false,
        [Op.and]: [
          Sequelize.literal(`NOT EXISTS (SELECT target_id FROM ${ReportContentDetailModel.getTableName()} as rp
            WHERE rp.target_id = "CommentModel"."id" AND rp.target_type = '${
              TargetType.COMMENT
            }')`),
        ],
        ...restQueryOptions,
      },
      order: [['createdAt', order]],
    };

    const { rows, meta } = await paginate(
      this._commentModel,
      findOptions,
      { previousCursor, nextCursor, limit },
      'id'
    );

    return { rows: rows.map((row) => this._factory.reconstitute(row)), meta };
  }

  private _getRestCondition(
    getCommentsDto: GetPaginationCommentProps
  ): WhereAttributeHash<IComment> {
    const { createdAtGT, createdAtGTE, createdAtLT, createdAtLTE } = getCommentsDto;
    const restQueryOptions: WhereAttributeHash<IComment> = {};

    if (createdAtGT) {
      restQueryOptions['createdAt'] = { [Op.gt]: createdAtGT };
    }
    if (createdAtGTE) {
      restQueryOptions['createdAt'] = { [Op.gte]: createdAtGTE };
    }
    if (createdAtLT) {
      restQueryOptions['createdAt'] = { [Op.lt]: createdAtLT };
    }
    if (createdAtLTE) {
      restQueryOptions['createdAt'] = { [Op.lte]: createdAtLTE };
    }

    return restQueryOptions;
  }
}
