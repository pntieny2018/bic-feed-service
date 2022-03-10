import { AutoIncrement, Column, CreatedAt, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript';
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
export class RecentSearchModel extends Model<IRecentSearchAttribute, Optional<IRecentSearchAttribute, 'id'>> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  createdBy: number;

  @Column
  updatedBy: number;

  @Column
  totalSearched: number;

  @Column
  target: string;

  @Column
  keyword: string;

  @CreatedAt
  createdAt?: Date;

  @UpdatedAt
  updatedAt?: Date;
}
