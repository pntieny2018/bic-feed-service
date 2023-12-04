import { ORDER } from '@beincom/constants';
import { StringHelper } from '@libs/common/helpers';
import { Attributes, FindOptions, Model, ModelStatic, Op, Order, WhereOptions } from 'sequelize';

import { CursorPaginationResult, CursorParam, PaginatedArgs } from '../../common';

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
      subQuery: false,
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
      throw new Error('Invalid cursor');
    }

    const operator = this._getOperator();

    return this._recursivelyGetPaginationQuery(cursors, [...this.cursorColumns], operator);
  }

  private _encode(row: T): string {
    const payload = this.cursorColumns.reduce((returnValue, orderItem) => {
      let field;
      if (typeof orderItem === 'object' && orderItem) {
        field = `${orderItem['as']}.${[orderItem['field']]}`;
        if (Array.isArray(row[orderItem['as']])) {
          return { ...returnValue, [field]: row[orderItem['as']][0][orderItem['field']] };
        } else {
          return { ...returnValue, [field]: row[orderItem['as']][orderItem['field']] };
        }
      } else {
        field = orderItem;
      }

      return { ...returnValue, [field]: row[field] };
    }, {});

    return createCursor(payload);
  }

  private _buildOrder(): Order {
    let { order } = this;
    if (!this.after && this.before) {
      order = this._reverseOrder(order);
    }

    return this.cursorColumns.map((column) => {
      return typeof column === 'string' ? [column, order] : [column['as'], column['field'], order];
    });
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
    return cursorKeys.length === this.cursorColumns.length;
  }

  private _recursivelyGetPaginationQuery(
    cursors: CursorParam,
    cursorColumns: (keyof Attributes<T> | object)[],
    operator: symbol
  ): WhereOptions {
    let key: string;
    let cursorColumnKey: string;
    if (typeof cursorColumns[0] === 'object') {
      key = `${cursorColumns[0]['as']}.${cursorColumns[0]['field']}`;
      cursorColumnKey = `$${cursorColumns[0]['as']}.${StringHelper.camelToSnakeCase(
        cursorColumns[0]['field']
      )}$`;
    } else {
      key = cursorColumns[0] as string;
      cursorColumnKey = key;
    }

    if (cursorColumns.length === 1) {
      return {
        [cursorColumnKey]: {
          [operator]: cursors[key],
        },
      };
    } else {
      return {
        [Op.or]: [
          {
            [cursorColumnKey]: {
              [operator]: cursors[key],
            },
          },
          {
            [cursorColumnKey]: cursors[key],
            ...this._recursivelyGetPaginationQuery(cursors, cursorColumns.slice(1), operator),
          },
        ],
      };
    }
  }
}
