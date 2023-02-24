import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GroupDto,
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { ITagQuery, TAG_QUERY_TOKEN } from '../../../domain/query-interface';
import { FindReactionsQuery } from './find-reactions.query';
import { FindReactionsDto } from './find-reactions.dto';

@QueryHandler(FindReactionsQuery)
export class FindReactionsHandler implements IQueryHandler<FindReactionsQuery, FindReactionsDto> {
  @Inject(GROUP_APPLICATION_TOKEN) private readonly _groupAppService: IGroupApplicationService;
  @Inject(TAG_QUERY_TOKEN) private readonly _tagQuery: ITagQuery;

  public async execute(query: FindReactionsQuery): Promise<FindReactionsDto> {
    const { target, targetId, limit, order, reactionName, latestId } = query.payload;
    // TODO: Implement this
    return;
  }
}
