import moment from 'moment';
import { OrderEnum } from '../pagination';
import { PaginatedArgs } from './paginated.args';
import { FindOptions, Model, ModelStatic, Op, WhereOptions } from 'sequelize';
import { CursorPaginationResult } from '../../types/cursor-pagination-result.type';

export async function paginate<T extends Model>(
  executer: ModelStatic<T>,
  query: FindOptions,
  paginatedArgs: PaginatedArgs,
  order = OrderEnum.DESC,
  cursorColumn = 'createdAt'
): Promise<CursorPaginationResult<T>> {
  const { before, after, limit } = paginatedArgs;
  let paginationQuery: WhereOptions | undefined;

  if (after) {
    paginationQuery = {
      [cursorColumn]: {
        [order === OrderEnum.ASC ? Op.gt : Op.lt]: moment(
          new Date(Buffer.from(after, 'base64').toString('utf8'))
        ).toDate(),
      },
    };
  } else if (before) {
    paginationQuery = {
      [cursorColumn]: {
        [order === OrderEnum.ASC ? Op.lt : Op.gt]: moment(
          new Date(Buffer.from(before, 'base64').toString('utf8'))
        ).toDate(),
      },
    };
  }

  if (!after && before) {
    order = order === OrderEnum.ASC ? OrderEnum.DESC : OrderEnum.ASC;
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

  if (hasMore) rows.pop();

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
