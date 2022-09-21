import { UserDto } from '../auth';
import { FindAndCountOptions, Op } from 'sequelize';
import { PageDto } from '../../common/dto';
import { InjectModel } from '@nestjs/sequelize';
import { GetCommentEditedHistoryDto } from './dto/requests';
import { plainToInstance } from 'class-transformer';
import { Injectable, Logger } from '@nestjs/common';
import { CommentEditedHistoryDto, CommentResponseDto } from './dto/response';
import { CommentEditedHistoryModel } from '../../database/models/comment-edited-history.model';

@Injectable()
export class CommentHistoryService {
  private _logger = new Logger(CommentHistoryService.name);

  public constructor(
    @InjectModel(CommentEditedHistoryModel)
    private readonly _commentEditedHistoryModel: typeof CommentEditedHistoryModel
  ) {}
  /**
   * Save comment edited history
   * @param commentId string
   * @param Object { oldData: CommentResponseDto; newData: CommentResponseDto }
   * @returns Promise resolve any
   */
  public async saveCommentEditedHistory(
    commentId: string,
    { oldData, newData }: { oldData: CommentResponseDto; newData: CommentResponseDto }
  ): Promise<any> {
    return this._commentEditedHistoryModel.create({
      commentId: commentId,
      oldData: oldData,
      newData: newData,
      editedAt: newData.updatedAt ?? newData.createdAt,
    });
  }

  /**
   * Delete comment edited history
   * @param commentId number
   * @returns Promise resolve any
   */
  public async deleteCommentEditedHistory(commentId: number): Promise<any> {
    return this._commentEditedHistoryModel.destroy({
      where: {
        commentId: commentId,
      },
    });
  }

  /**
   * Get comment edited history
   * @param user UserDto
   * @param commentId string
   * @param getCommentEditedHistoryDto GetCommentEditedHistoryDto
   * @returns Promise resolve PageDto
   */
  public async getCommentEditedHistory(
    user: UserDto,
    commentId: string,
    getCommentEditedHistoryDto: GetCommentEditedHistoryDto
  ): Promise<PageDto<CommentEditedHistoryDto>> {
    try {
      //const postId = await this._commentService.getPostIdOfComment(commentId);
      //const post = await this._postService.findPost({ postId: postId });
      //await this._authorityService.checkCanReadPost(user, post);

      const { offset, limit, order } = getCommentEditedHistoryDto;
      const conditions = this._getCondition(commentId);
      const { rows, count } = await this._commentEditedHistoryModel.findAndCountAll({
        where: {
          ...conditions,
        },
        order: [['id', order]],
        offset: offset,
        limit: limit,
      });

      const result = rows.map((e) => {
        const newData: CommentResponseDto = e.toJSON().newData;
        return plainToInstance(
          CommentEditedHistoryDto,
          {
            ...newData,
            commentId: newData.id,
            editedAt: newData.updatedAt ?? newData.createdAt,
          },
          { excludeExtraneousValues: true }
        );
      });

      return new PageDto(result, {
        limit: limit,
        total: count,
      });
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw e;
    }
  }

  private _getCondition(commentId: string): Pick<FindAndCountOptions, 'where'> {
    const conditions = {};
    conditions['commentId'] = commentId;
    return conditions;
  }
}
