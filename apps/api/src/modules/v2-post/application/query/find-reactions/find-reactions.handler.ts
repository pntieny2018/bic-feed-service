import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindReactionsQuery } from './find-reactions.query';
import { FindReactionsDto } from './find-reactions.dto';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { ObjectHelper } from '../../../../../common/helpers';
import { ReactionEntity } from '../../../domain/model/reaction';
import {
  IReactionQuery,
  REACTION_QUERY_TOKEN,
} from '../../../domain/query-interface/reaction.query.interface';
import { ReactionDto } from '../../dto';

@QueryHandler(FindReactionsQuery)
export class FindReactionsHandler implements IQueryHandler<FindReactionsQuery, FindReactionsDto> {
  public constructor(
    @Inject(USER_APPLICATION_TOKEN) private readonly _userAppService: IUserApplicationService,
    @Inject(REACTION_QUERY_TOKEN) private readonly _reactionQuery: IReactionQuery
  ) {}

  public async execute(query: FindReactionsQuery): Promise<FindReactionsDto> {
    const { authUser } = query.payload;
    const { rows, total } = await this._reactionQuery.getPagination(query.payload);

    const actorIds = rows.map((r) => r.get('createdBy'));
    const actors = await this._userAppService.findAllAndFilterByPersonalVisibility(
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
