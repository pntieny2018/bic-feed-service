import moment from 'moment';
import { OrderEnum } from '../pagination';
import { PaginatedArgs } from './paginated.args';
import { FindOptions, Model, ModelStatic, Op, WhereOptions } from 'sequelize';
import { CursorPaginationResult } from '../../types/cursor-pagination-result.type';

export async function paginate<T extends Model>(
  executer: ModelStatic<T>,
  query: FindOptions,
  paginatedArgs: PaginatedArgs,
  order: OrderEnum,
  cursorColumn = 'createdAt'
): Promise<CursorPaginationResult<T>> {
  const { previousCursor, nextCursor, limit } = paginatedArgs;
  let paginationQuery: WhereOptions | undefined;

  if (nextCursor) {
    const operator = order === OrderEnum.ASC ? Op.gt : Op.lt;
    paginationQuery = {
      [cursorColumn]: {
        [operator]: moment(new Date(Buffer.from(nextCursor, 'base64').toString('utf8'))).toDate(),
      },
    };
  }

  if (previousCursor) {
    const operator = order === OrderEnum.ASC ? Op.lt : Op.gt;
    paginationQuery = {
      [cursorColumn]: {
        [operator]: moment(
          new Date(Buffer.from(previousCursor, 'base64').toString('utf8'))
        ).toDate(),
      },
    };
  }

  const paginationWhere: WhereOptions | undefined = paginationQuery
    ? { [Op.and]: [paginationQuery, query.where] }
    : query.where;

  const paginationQueryOptions = {
    ...query,
    where: paginationWhere,
    limit: limit + 1,
  };

  const rows = await executer.findAll(paginationQueryOptions);

  const hasNextPage =
    (Boolean(nextCursor) && rows.length - limit > 0) || (!nextCursor && rows.length - limit > 0);

  const hasPreviousPage = Boolean(previousCursor) && rows.length - limit > 0;

  if (rows.length - limit > 0) rows.pop();

  const meta = {
    hasNextPage,
    hasPreviousPage,
    previousCursor:
      rows.length > 0 ? Buffer.from(`${rows[0][cursorColumn]}`).toString('base64') : null,
    nextCursor:
      rows.length > 0
        ? Buffer.from(`${rows[rows.length - 1][cursorColumn]}`).toString('base64')
        : null,
  };

  return { rows, meta };
}
