import {
  AutoIncrement,
  Column,
  CreatedAt,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

export interface IRecentSearchAttribute {
  id: number;
  createdBy: number;
  updatedBy: number;
  target: string;
  keyword: string;
  totalSearched: number;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'recent_searches',
})
export class RecentSearchModel extends Model<
  IRecentSearchAttribute,
  Optional<IRecentSearchAttribute, 'id'>
> {
  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;

  @Column
  public createdBy: number;

  @Column
  public updatedBy: number;

  @Column
  public totalSearched: number;

  @Column
  public target: string;

  @Column
  public keyword: string;

  @CreatedAt
  public createdAt?: Date;

  @UpdatedAt
  public updatedAt?: Date;
}
