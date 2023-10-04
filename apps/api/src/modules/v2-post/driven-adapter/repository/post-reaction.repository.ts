import { ReactionEntity } from '../../domain/model/reaction';
import {
  FindOnePostReactionProps,
  IPostReactionRepository,
} from '../../domain/repositoty-interface';
import { PostReactionMapper } from '../mapper/post-reaction.mapper';
import { LibPostReactionRepository } from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PostReactionRepository implements IPostReactionRepository {
  public constructor(
    private readonly _libPostReactionRepo: LibPostReactionRepository,
    private readonly _postReactionMapper: PostReactionMapper
  ) {}

  public async findOne(input: FindOnePostReactionProps): Promise<ReactionEntity> {
    const postReaction = await this._libPostReactionRepo.first({
      where: input,
    });
    return this._postReactionMapper.toDomain(postReaction);
  }

  public async create(data: ReactionEntity): Promise<void> {
    await this._libPostReactionRepo.create(this._postReactionMapper.toPersistence(data));
  }

  public async delete(id: string): Promise<void> {
    await this._libPostReactionRepo.delete({
      where: { id },
    });
  }
}
