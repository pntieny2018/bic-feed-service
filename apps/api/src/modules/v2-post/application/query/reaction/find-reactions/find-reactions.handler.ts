import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ObjectHelper } from '../../../../../../common/helpers';
import {
  IReactionDomainService,
  REACTION_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ReactionEntity } from '../../../../domain/model/reaction';
import { IUserAdapter, USER_ADAPTER } from '../../../../domain/service-adapter-interface';
import { FindReactionsDto, ReactionDto } from '../../../dto';

import { FindReactionsQuery } from './find-reactions.query';

@QueryHandler(FindReactionsQuery)
export class FindReactionsHandler implements IQueryHandler<FindReactionsQuery, FindReactionsDto> {
  public constructor(
    @Inject(USER_ADAPTER) private readonly _userAdapter: IUserAdapter,
    @Inject(REACTION_DOMAIN_SERVICE_TOKEN)
    private readonly _reactionDomainService: IReactionDomainService
  ) {}

  public async execute(query: FindReactionsQuery): Promise<FindReactionsDto> {
    const { authUser } = query.payload;
    const { rows, total } = await this._reactionDomainService.getReactions(query.payload);

    const actorIds = rows.map((r) => r.get('createdBy'));
    const actors = await this._userAdapter.findAllAndFilterByPersonalVisibility(
      actorIds,
      authUser.id
    );
    return new FindReactionsDto({
      rows: rows.map(
        (r: ReactionEntity) =>
          new ReactionDto({
            id: r.get('id'),
            actor: ObjectHelper.omit(
              ['groups'],
              actors.find((a) => a.id == r.get('createdBy'))
            ) as any,
            reactionName: r.get('reactionName'),
            createdAt: r.get('createdAt'),
          })
      ),
      total,
    });
  }
}
