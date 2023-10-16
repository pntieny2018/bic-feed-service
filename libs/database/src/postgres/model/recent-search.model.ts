import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  Column,
  CreatedAt,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

export type RecentSearchAttribute = InferAttributes<RecentSearchModel>;

@Table({
  tableName: 'recent_searches',
})
export class RecentSearchModel extends Model<
  RecentSearchAttribute,
  InferCreationAttributes<RecentSearchModel>
> {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public createdBy: string;

  @Column
  public updatedBy: string;

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
