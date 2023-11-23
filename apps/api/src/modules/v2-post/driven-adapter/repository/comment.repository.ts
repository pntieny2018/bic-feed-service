import { CursorPaginationResult } from '@libs/database/postgres/common';
import { CommentAttributes, CommentModel } from '@libs/database/postgres/model';
import { LibCommentRepository, LibFollowRepository } from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';

import { CommentEntity } from '../../domain/model/comment';
import {
  FindOneProps,
  GetAroundCommentProps,
  GetAroundCommentResult,
  GetPaginationCommentProps,
  ICommentRepository,
} from '../../domain/repositoty-interface';
import { CommentMapper } from '../mapper/comment.mapper';
import { getDatabaseConfig } from '@libs/database/postgres/config';

@Injectable()
export class CommentRepository implements ICommentRepository {
  public constructor(
    private readonly _libCommentRepo: LibCommentRepository,
    private readonly _libFollowRepo: LibFollowRepository,
    private readonly _commentMapper: CommentMapper
  ) {}

  public async getPagination(
    input: GetPaginationCommentProps
  ): Promise<CursorPaginationResult<CommentEntity>> {
    const { rows, meta } = await this._libCommentRepo.getPagination(input);
    return {
      rows: rows.map((comment) => this._commentMapper.toDomain(comment)),
      meta,
    };
  }

  public async getAroundComment(
    commentId: string,
    props: GetAroundCommentProps
  ): Promise<GetAroundCommentResult> {
    const { rows, meta, targetIndex } = await this._libCommentRepo.getAroundComment(
      commentId,
      props
    );
    return {
      rows: rows.map((comment) => this._commentMapper.toDomain(comment)),
      meta,
      targetIndex,
    };
  }

  public async createComment(data: CommentEntity): Promise<CommentEntity> {
    const comment = await this._libCommentRepo.create(this._commentMapper.toPersistence(data));

    return this._commentMapper.toDomain(comment);
  }

  public async findOne(
    where: WhereOptions<CommentAttributes>,
    options?: FindOneProps
  ): Promise<CommentEntity> {
    const comment = await this._libCommentRepo.findOne(where, options);
    return this._commentMapper.toDomain(comment);
  }

  public async update(commentEntity: CommentEntity): Promise<void> {
    try {
      await this._libCommentRepo.update(this._commentMapper.toPersistence(commentEntity), {
        where: {
          id: commentEntity.get('id'),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  public async destroyComment(id: string): Promise<void> {
    await this._libCommentRepo.destroyComment(id);
  }

  public async findPrevComments(commentId: string, contentId: string): Promise<CommentEntity[]> {
    const { schema } = getDatabaseConfig();
    const comments = await this._libCommentRepo.findMany({
      where: {
        postId: contentId,
        id: {
          [Op.not]: commentId,
        },
      },
      whereRaw: `created_at <= (SELECT created_at FROM ${schema}.${CommentModel.tableName} WHERE id = '${commentId}')`,
      order: [['created_at', 'DESC']],
    });

    return (comments ?? []).map((comment) => this._commentMapper.toDomain(comment));
  }

  public async getValidUsersFollow(userIds: string[], groupIds: string[]): Promise<string[]> {
    const { schema } = getDatabaseConfig();
    const followModel = this._libFollowRepo.getModel();
    if (!userIds.length) {
      return [];
    }
    const rows = await followModel.sequelize.query(
      ` SELECT DISTINCT(user_id), zindex
        FROM ${schema}.${followModel.tableName} tb1
        WHERE group_id IN (:groupIds) AND user_id IN (:userIds)`,
      {
        replacements: {
          groupIds,
          userIds,
        },
      }
    );
    if (!rows) {
      return [];
    }
    return rows[0].map((r) => r['user_id']);
  }

  public async getParentComment(
    commentId: string,
    commentParentId: string
  ): Promise<CommentEntity> {
    const comment = await this._libCommentRepo.findOne(
      {
        id: commentParentId,
      },
      {
        includeChildComments: {
          childCommentId: commentId,
        },
      }
    );

    return this._commentMapper.toDomain(comment);
  }
}
