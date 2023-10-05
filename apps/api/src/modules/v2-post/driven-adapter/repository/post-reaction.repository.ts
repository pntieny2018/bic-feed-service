import {
  ILibPostReactionRepository,
  LIB_POST_REACTION_REPOSITORY_TOKEN,
} from '@libs/database/postgres/repository/interface';
import { Inject } from '@nestjs/common';

import { ReactionEntity } from '../../domain/model/reaction';
import {
  FindOnePostReactionProps,
  IPostReactionRepository,
} from '../../domain/repositoty-interface';
import { PostReactionMapper } from '../mapper/post-reaction.mapper';

export class PostReactionRepository implements IPostReactionRepository {
  public constructor(
    @Inject(LIB_POST_REACTION_REPOSITORY_TOKEN)
    private readonly _libPostReactionRepository: ILibPostReactionRepository,
    private readonly _postReactionMapper: PostReactionMapper
  ) {}

  public async findOne(input: FindOnePostReactionProps): Promise<ReactionEntity> {
    const postReaction = await this._libPostReactionRepository.findOne(input);
    return this._postReactionMapper.toDomain(postReaction);
  }

  public async create(data: ReactionEntity): Promise<void> {
    return this._libPostReactionRepository.create(this._postReactionMapper.toPersistence(data));
  }

  public async delete(id: string): Promise<void> {
    return this._libPostReactionRepository.delete(id);
  }
}
