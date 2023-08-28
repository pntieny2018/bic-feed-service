import { ORDER } from '@beincom/constants';
import { Attributes, FindOptions, Model, ModelStatic, Op, Order, WhereOptions } from 'sequelize';

import { InvalidCursorParamsException } from '../../../modules/v2-post/domain/exception';
import { CursorPaginationResult } from '../../types/cursor-pagination-result.type';

import { PaginatedArgs } from './paginated.args';
import { CursorParam } from './paginated.interface';
import { createCursor, parseCursor } from './utils';

export class CursorPaginator<T extends Model> {
  public modelClass: ModelStatic<T>;

  public cursorColumns: (keyof Attributes<T>)[] = ['createdAt'];

  public after?: string;

  public before?: string;

  public limit = 10;

  public order: ORDER = ORDER.DESC;

  public constructor(
    modelClass: ModelStatic<T>,
    cursorColumns: (keyof Attributes<T>)[],
    paginationParameters: PaginatedArgs,
    order: ORDER
  ) {
    this.modelClass = modelClass;
    this.cursorColumns = cursorColumns;
    this.after = paginationParameters.after;
    this.before = paginationParameters.before;
    this.limit = paginationParameters.limit;
    this.order = order;
  }

  public async paginate(query: FindOptions): Promise<CursorPaginationResult<T>> {
    const paginationQuery = this._getPaginationQuery();
    query.order = this._buildOrder();

    const paginationWhere: WhereOptions | undefined = paginationQuery
      ? { [Op.and]: [paginationQuery, query.where] }
      : query.where;

    const paginationQueryOptions = {
      ...query,
      where: paginationWhere,
      limit: this.limit + 1,
    };

    const rows = await this.modelClass.findAll(paginationQueryOptions);

    const hasMore = rows.length > this.limit;

    if (hasMore) {
      rows.pop();
    }

    if (!this.after && this.before) {
      rows.reverse();
    }

    const hasPreviousPage = Boolean(this.after) || (Boolean(this.before) && hasMore);
    const hasNextPage = Boolean(this.before) || hasMore;

    const meta = {
      startCursor: rows.length > 0 ? this._encode(rows[0]) : null,
      endCursor: rows.length > 0 ? this._encode(rows[rows.length - 1]) : null,
      hasNextPage,
      hasPreviousPage,
    };

    return { rows, meta };
  }

  private _getPaginationQuery(): WhereOptions | undefined {
    let cursors: CursorParam;
    let paginationQuery: WhereOptions | undefined;

    if (!this.after && !this.before) {
      return paginationQuery;
    }

    if (this.after) {
      cursors = parseCursor(this.after);
    }

    if (this.before) {
      cursors = parseCursor(this.before);
    }

    if (cursors && !this._isValidCursor(cursors)) {
      throw new InvalidCursorParamsException();
    }

    const operator = this._getOperator();

    return this._recursivelyGetPaginationQuery(cursors, [...this.cursorColumns], operator);
  }

  private _encode(row: T): string {
    const attributes = Object.keys(this.modelClass.getAttributes());
    const encodeColumn = this.cursorColumns.filter((column) =>
      attributes.includes(column as string)
    );
    const payload = encodeColumn.reduce((returnValue, column) => {
      return {
        ...returnValue,
        [column]: row.getDataValue(column),
      };
    }, {});

    return createCursor(payload);
  }

  private _buildOrder(): Order {
    let { order } = this;

    if (!this.after && this.before) {
      order = this._reverseOrder(order);
    }

    return this.cursorColumns.map((column) => [column as string, order]);
  }

  private _getOperator(): symbol {
    if (this.after) {
      return this.order === ORDER.ASC ? Op.gt : Op.lt;
    } else if (this.before) {
      return this.order === ORDER.ASC ? Op.lt : Op.gt;
    }
  }

  private _reverseOrder(order: ORDER): ORDER {
    return order === ORDER.ASC ? ORDER.DESC : ORDER.ASC;
  }

  private _isValidCursor(cursors: CursorParam): boolean {
    const cursorKeys = Object.keys(cursors);
    const attributes = Object.keys(this.modelClass.getAttributes());
    return cursorKeys.every((column) => attributes.includes(column));
  }

  private _recursivelyGetPaginationQuery(
    cursors: CursorParam,
    cursorColumns: (keyof Attributes<T>)[],
    operator: symbol
  ): WhereOptions {
    const attributes = Object.keys(this.modelClass.getAttributes());
    const encodeColumn = cursorColumns.filter((column) => attributes.includes(column as string));

    if (encodeColumn.length === 1) {
      return {
        [encodeColumn[0]]: {
          [operator]: cursors[encodeColumn[0] as string],
        },
      };
    } else {
      return {
        [Op.or]: [
          {
            [encodeColumn[0]]: {
              [operator]: cursors[encodeColumn[0] as string],
            },
          },
          {
            [encodeColumn[0]]: cursors[encodeColumn[0] as string],
            ...this._recursivelyGetPaginationQuery(cursors, encodeColumn.slice(1), operator),
          },
        ],
      };
    }
  }
}
