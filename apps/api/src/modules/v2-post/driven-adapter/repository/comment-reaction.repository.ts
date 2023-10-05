import {
  ILibCommentReactionRepository,
  LIB_COMMENT_REACTION_REPOSITORY_TOKEN,
} from '@libs/database/postgres/repository/interface';
import { Inject } from '@nestjs/common';

import { ReactionEntity } from '../../domain/model/reaction';
import {
  FindOneCommentReactionProps,
  ICommentReactionRepository,
} from '../../domain/repositoty-interface';
import { CommentReactionMapper } from '../mapper/comment-reaction.mapper';

export class CommentReactionRepository implements ICommentReactionRepository {
  public constructor(
    @Inject(LIB_COMMENT_REACTION_REPOSITORY_TOKEN)
    private readonly _libCommentReactionRepository: ILibCommentReactionRepository,
    private readonly _commentReactionMapper: CommentReactionMapper
  ) {}

  public async findOne(input: FindOneCommentReactionProps): Promise<ReactionEntity> {
    return this._commentReactionMapper.toDomain(
      await this._libCommentReactionRepository.findOne(input)
    );
  }

  public async create(data: ReactionEntity): Promise<void> {
    return this._libCommentReactionRepository.create(
      this._commentReactionMapper.toPersistence(data)
    );
  }

  public async delete(id: string): Promise<void> {
    return this._libCommentReactionRepository.delete(id);
  }
}
