import { CursorPaginationProps, CursorPaginationResult } from '@libs/database/postgres/common';
import { WhereOptions } from 'sequelize';
import {
  Attributes,
  BulkCreateOptions,
  CreateOptions,
  CreationAttributes,
  DestroyOptions,
  IncludeOptions,
  UpdateOptions,
} from 'sequelize/types/model';
import { Literal } from 'sequelize/types/utils';
import { Model, ModelCtor } from 'sequelize-typescript';

export interface IBaseRepository<M extends Model> {
  getModel(): ModelCtor<M>;
  create(data: CreationAttributes<M>, options?: CreateOptions): Promise<M>;

  update(
    values: {
      [key in keyof Attributes<M>]?: Attributes<M>[key];
    },
    options: UpdateOptions<M>
  ): Promise<[affectedCount: number]>;

  first(options: FindOptions<M>): Promise<M>;

  findMany(options: FindOptions<M>): Promise<M[]>;

  findAndCountAll(options: Omit<FindOptions<M>, 'group'>): Promise<{ rows: M[]; count: number }>;

  count(options: Omit<FindOptions<M>, 'group'>): Promise<number>;

  sum(field: keyof Attributes<M>, options: Omit<FindOptions<M>, 'group'>): Promise<number>;

  delete(options: DestroyOptions<M>): Promise<number>;

  bulkCreate(
    records: ReadonlyArray<CreationAttributes<M>>,
    options?: BulkCreateOptions<Attributes<M>>
  ): Promise<M[]>;

  cursorPaginate(
    findOptions: FindOptions<M>,
    paginationProps: CursorPaginationProps
  ): Promise<CursorPaginationResult<M>>;
}

export type FindOptions<M extends Model> = {
  select?: (keyof Attributes<M>)[];
  selectExclude?: (keyof Attributes<M>)[];
  selectRaw?: [string, string][];
  whereRaw?: string;
  orWhereRaw?: string;
  where?: WhereOptions<Attributes<M>>;
  include?: Include<M>[];
  limit?: number;
  offset?: number;
  order?: [string | Literal, 'ASC' | 'DESC'][];
  group?: string[];
};
export type Include<M extends Model> = Omit<IncludeOptions, 'attributes'> & {
  select?: string[];
  selectExclude?: string[];
  selectRaw?: [string, string][];
  whereRaw?: string;
  orWhereRaw?: string;
  where?: WhereOptions<Attributes<M>>;
};
