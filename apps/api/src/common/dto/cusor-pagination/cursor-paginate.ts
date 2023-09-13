import { ORDER } from '@beincom/constants';
import moment from 'moment';
import { FindOptions, Model, ModelStatic, Op, WhereOptions } from 'sequelize';

import { CursorPaginationResult } from '../../types/cursor-pagination-result.type';

import { PaginatedArgs } from './paginated.args';

export async function paginate<T extends Model>(
  executer: ModelStatic<T>,
  query: FindOptions,
  paginatedArgs: PaginatedArgs,
  order = ORDER.DESC,
  cursorColumn = 'createdAt'
): Promise<CursorPaginationResult<T>> {
  const { before, after, limit } = paginatedArgs;
  let paginationQuery: WhereOptions | undefined;

  if (after) {
    paginationQuery = {
      [cursorColumn]: {
        [order === ORDER.ASC ? Op.gt : Op.lt]: moment(
          new Date(Buffer.from(after, 'base64').toString('utf8'))
        ).toDate(),
      },
    };
  } else if (before) {
    paginationQuery = {
      [cursorColumn]: {
        [order === ORDER.ASC ? Op.lt : Op.gt]: moment(
          new Date(Buffer.from(before, 'base64').toString('utf8'))
        ).toDate(),
      },
    };
  }

  if (!after && before) {
    order = order === ORDER.ASC ? ORDER.DESC : ORDER.ASC;
  }

  query.order = [[cursorColumn, order]];

  const paginationWhere: WhereOptions | undefined = paginationQuery
    ? { [Op.and]: [paginationQuery, query.where] }
    : query.where;

  const paginationQueryOptions = {
    ...query,
    where: paginationWhere,
    limit: limit + 1,
  };

  const rows = await executer.findAll(paginationQueryOptions);

  const hasMore = rows.length > limit;

  if (hasMore) {
    rows.pop();
  }

  if (!after && before) {
    rows.reverse();
  }

  const hasPreviousPage = Boolean(after) || (Boolean(before) && hasMore);
  const hasNextPage = Boolean(before) || hasMore;

  const meta = {
    startCursor:
      rows.length > 0
        ? Buffer.from(`${rows[0][cursorColumn].toISOString()}`).toString('base64')
        : null,
    endCursor:
      rows.length > 0
        ? Buffer.from(`${rows[rows.length - 1][cursorColumn].toISOString()}`).toString('base64')
        : null,
    hasNextPage,
    hasPreviousPage,
  };

  return { rows, meta };
}
