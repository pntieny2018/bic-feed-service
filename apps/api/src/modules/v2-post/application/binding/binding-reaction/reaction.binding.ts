import { Inject } from '@nestjs/common';

import { ReactionEntity } from '../../../domain/model/reaction';
import { IUserAdapter, USER_ADAPTER } from '../../../domain/service-adapter-interface ';
import { ReactionDto } from '../../dto';

import { IReactionBinding } from './reaction.interface';

export class ReactionBinding implements IReactionBinding {
  public constructor(
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter
  ) {}

  public async binding(entity: ReactionEntity): Promise<ReactionDto> {
    const actor = await this._userAdapter.getUserById(entity.get('createdBy'));

    return new ReactionDto({
      id: entity.get('id'),
      reactionName: entity.get('reactionName'),
      targetId: entity.get('targetId'),
      target: entity.get('target'),
      actor,
      createdAt: entity.get('createdAt'),
    });
  }
}
