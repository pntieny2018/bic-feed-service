import { LibCommentReactionRepository } from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';

import { ReactionEntity } from '../../domain/model/reaction';
import {
  FindOneCommentReactionProps,
  ICommentReactionRepository,
} from '../../domain/repositoty-interface';
import { CommentReactionMapper } from '../mapper/comment-reaction.mapper';

@Injectable()
export class CommentReactionRepository implements ICommentReactionRepository {
  public constructor(
    private readonly _libCommentReactionRepo: LibCommentReactionRepository,
    private readonly _commentReactionMapper: CommentReactionMapper
  ) {}

  public async findOne(input: FindOneCommentReactionProps): Promise<ReactionEntity> {
    const model = await this._libCommentReactionRepo.first({
      where: {
        ...input,
      },
    });
    return this._commentReactionMapper.toDomain(model);
  }

  public async create(data: ReactionEntity): Promise<void> {
    return this._libCommentReactionRepo.createCommentReactionByStore(
      this._commentReactionMapper.toPersistence(data)
    );
  }

  public async delete(id: string): Promise<void> {
    await this._libCommentReactionRepo.delete({
      where: {
        id,
      },
    });
  }
}
