import { FindOptions } from '@libs/database/postgres';
import {
  CursorPaginationProps,
  CursorPaginationResult,
  CursorPaginator,
  PAGING_DEFAULT_LIMIT,
} from '@libs/database/postgres/common';
import { IBaseRepository } from '@libs/database/postgres/repository/interface';
import { Op, Sequelize, WhereOptions } from 'sequelize';
import {
  Attributes,
  BulkCreateOptions,
  CreateOptions,
  CreationAttributes,
  DestroyOptions,
  UpdateOptions,
} from 'sequelize/types/model';
import { Model, ModelCtor } from 'sequelize-typescript';

export abstract class BaseRepository<M extends Model> implements IBaseRepository<M> {
  protected model: ModelCtor<M>;
  protected constructor(model: ModelCtor<M>) {
    this.model = model;
  }

  public getModel(): ModelCtor<M> {
    return this.model;
  }
  public async create(data: CreationAttributes<M>, options?: CreateOptions): Promise<M> {
    return this.model.create(data, options);
  }

  public async update(
    values: {
      [key in keyof Attributes<M>]?: Attributes<M>[key];
    },
    options: UpdateOptions<M>
  ): Promise<[affectedCount: number]> {
    return this.model.update(values, options);
  }

  public async first(options: FindOptions<M> = {}): Promise<M> {
    const attributes = this._buildSelect(options);
    const include = this._buildInclude(options);
    const where = this._buildWhere(options);
    return await this.model.findOne({
      attributes: !attributes.include.length && !attributes.exclude.length ? undefined : attributes,
      where,
      include: include.length > 0 ? include : undefined,
      order: options.order,
      group: options.group,
    });
  }

  public async findMany(options: FindOptions<M> = {}): Promise<M[]> {
    const attributes = this._buildSelect(options);
    const include = this._buildInclude(options);
    const where = this._buildWhere(options);
    return this.model.findAll({
      attributes: !attributes.include.length && !attributes.exclude.length ? undefined : attributes,
      where,
      include: include.length > 0 ? include : undefined,
      order: options.order,
      group: options.group,
      limit: options.limit || undefined,
      offset: options.offset || undefined,
    });
  }

  public async findAndCountAll(
    options: Omit<FindOptions<M>, 'group'> = {}
  ): Promise<{ rows: M[]; count: number }> {
    const attributes = this._buildSelect(options);
    const include = this._buildInclude(options);
    const where = this._buildWhere(options);
    return this.model.findAndCountAll({
      attributes: !attributes.include.length && !attributes.exclude.length ? undefined : attributes,
      where,
      include: include.length > 0 ? include : undefined,
      order: options.order,
      limit: options.limit || 10,
      offset: options.offset || undefined,
    });
  }

  public async count(options: Omit<FindOptions<M>, 'group'> = {}): Promise<number> {
    return this.model.count(options);
  }

  public async sum(
    field: keyof Attributes<M>,
    options: Omit<FindOptions<M>, 'group'> = {}
  ): Promise<number> {
    return this.model.sum(field, options);
  }

  public async delete(options: DestroyOptions<M>): Promise<number> {
    return this.model.destroy(options);
  }

  public async bulkCreate(
    records: ReadonlyArray<CreationAttributes<M>>,
    options?: BulkCreateOptions<Attributes<M>>
  ): Promise<M[]> {
    return this.model.bulkCreate(records, options);
  }

  protected _buildSelect(options: Pick<FindOptions<M>, 'select' | 'selectRaw' | 'selectExclude'>): {
    include: string[];
    exclude: string[];
  } {
    const attributes = {
      include: [],
      exclude: [],
    };
    if (options.select) {
      attributes.include.push(...options.select);
    }
    if (options.selectRaw) {
      options.selectRaw.forEach((item) => {
        attributes.include.push([Sequelize.literal(item[0]), item[1]]);
      });
    }
    if (options.selectExclude) {
      attributes.exclude.push(...options.selectExclude);
    }
    return attributes;
  }

  protected _buildWhere(
    options: Pick<FindOptions<M>, 'where' | 'whereRaw' | 'orWhereRaw'>
  ): WhereOptions<Attributes<M>> {
    let whereOptions: WhereOptions<Attributes<M>> = {};

    if (options.where) {
      whereOptions = { ...options.where };
    }
    if (options.whereRaw) {
      whereOptions[Op.and] = Sequelize.literal(options.whereRaw);
    }
    if (options.orWhereRaw) {
      whereOptions[Op.or] = Sequelize.literal(options.orWhereRaw);
    }
    return whereOptions;
  }

  protected _buildInclude(options: Pick<FindOptions<M>, 'include'>): string[] {
    const include = [];
    if (options.include) {
      options.include.forEach((item) => {
        const attributes = this._buildSelect(item);
        const where = this._buildWhere(item);
        include.push({
          attributes:
            !attributes.include.length && !attributes.exclude.length ? undefined : attributes,
          where,
          ...item,
        });
      });
    }
    return include;
  }

  public async cursorPaginate(
    findOptions: FindOptions<M>,
    paginationProps: CursorPaginationProps
  ): Promise<CursorPaginationResult<M>> {
    const { after, before, limit = PAGING_DEFAULT_LIMIT, order, column } = paginationProps;

    const paginator = new CursorPaginator(this.model, [column], { before, after, limit }, order);
    const { rows, meta } = await paginator.paginate(findOptions);

    return {
      rows,
      meta,
    };
  }

  public async max(
    field: keyof Attributes<M>,
    options: Omit<FindOptions<M>, 'group'> = {}
  ): Promise<number> {
    return this.model.max(field, options);
  }
}
