import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { FindReactionsQuery } from './find-reactions.query';
import { FindReactionsDto } from './find-reactions.dto';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { ReactionResponseDto } from '../../../../reaction/dto/response';
import { ObjectHelper } from '../../../../../common/helpers';
import { IReactionQuery, REACTION_QUERY_TOKEN } from '../../../domain/query-interface';
import { ReactionEntity } from '../../../domain/model/reaction';

@QueryHandler(FindReactionsQuery)
export class FindReactionsHandler implements IQueryHandler<FindReactionsQuery, FindReactionsDto> {
  @Inject(GROUP_APPLICATION_TOKEN) private readonly _groupAppService: IGroupApplicationService;
  @Inject(USER_APPLICATION_TOKEN) private readonly _userAppService: IUserApplicationService;
  @Inject(REACTION_QUERY_TOKEN) private readonly _reactionQuery: IReactionQuery;

  public async execute(query: FindReactionsQuery): Promise<FindReactionsDto> {
    const { rows, total } = await this._reactionQuery.getPagination(query.payload);

    const actorIds = rows.map((r) => r.get('createdBy'));
    const actors = await this._userAppService.findAllByIds(actorIds);
    return {
      rows: rows.map((r: ReactionEntity) => ({
        id: r.get('id'),
        actor: ObjectHelper.omit(
          ['groups'],
          actors.find((a) => a.id == r.get('createdBy'))
        ) as any,
        reactionName: r.get('reactionName'),
        createdAt: r.get('createdAt'),
      })),
      total,
    };
  }
}
