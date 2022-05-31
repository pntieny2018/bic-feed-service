import {
  AllowNull,
  Column,
  CreatedAt,
  Model,
  PrimaryKey,
  Table,
  Default,
  UpdatedAt,
} from 'sequelize-typescript';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';

export interface ISeries {
  id?: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdBy: number;
  updatedBy: number;
  totalArticle: number;
  totalView: number;
  createdAt: Date;
  updatedAt: Date;
}

@Table({
  tableName: 'series',
})
export class SeriesModel extends Model<ISeries, Omit<ISeries, 'id'>> implements ISeries {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public name: string;

  @Column
  public slug: string;

  @Column
  public isActive: boolean;

  @Column
  public createdBy: number;

  @Column
  public updatedBy: number;

  @Column
  public totalArticle: number;

  @Column
  public totalView: number;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt: Date;
}
