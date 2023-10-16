import { CursorPaginationResult } from '@libs/database/postgres/common';
import { CommentAttributes } from '@libs/database/postgres/model/comment.model';
import {
  ILibCommentRepository,
  LIB_COMMENT_REPOSITORY_TOKEN,
} from '@libs/database/postgres/repository/interface';
import { Inject, Injectable } from '@nestjs/common';
import { WhereOptions } from 'sequelize';

import { CommentEntity } from '../../domain/model/comment';
import {
  FindOneProps,
  GetAroundCommentProps,
  GetAroundCommentResult,
  GetPaginationCommentProps,
  ICommentRepository,
} from '../../domain/repositoty-interface';
import { CommentMapper } from '../mapper/comment.mapper';

@Injectable()
export class CommentRepository implements ICommentRepository {
  public constructor(
    @Inject(LIB_COMMENT_REPOSITORY_TOKEN)
    private readonly _libCommentRepository: ILibCommentRepository,
    private readonly _commentMapper: CommentMapper
  ) {}

  public async getPagination(
    input: GetPaginationCommentProps
  ): Promise<CursorPaginationResult<CommentEntity>> {
    const { rows, meta } = await this._libCommentRepository.getPagination(input);
    return {
      rows: rows.map((comment) => this._commentMapper.toDomain(comment)),
      meta,
    };
  }

  public async getAroundComment(
    commentId: string,
    props: GetAroundCommentProps
  ): Promise<GetAroundCommentResult> {
    const { rows, meta, targetIndex } = await this._libCommentRepository.getAroundComment(
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
    const comment = await this._libCommentRepository.createComment(
      this._commentMapper.toPersistence(data)
    );

    return this._commentMapper.toDomain(comment);
  }

  public async findOne(
    where: WhereOptions<CommentAttributes>,
    options?: FindOneProps
  ): Promise<CommentEntity> {
    const comment = await this._libCommentRepository.findOne(where, options);
    return this._commentMapper.toDomain(comment);
  }

  public async update(commentEntity: CommentEntity): Promise<void> {
    try {
      await this._libCommentRepository.update(
        commentEntity.get('id'),
        this._commentMapper.toPersistence(commentEntity)
      );
    } catch (error) {
      throw error;
    }
  }

  public async destroyComment(id: string): Promise<void> {
    await this._libCommentRepository.destroyComment(id);
  }
}
