import {
  AllowNull,
  Column,
  CreatedAt,
  Default,
  ForeignKey,
  Length,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';

export enum CategoryLevel {
  LEVEL_1 = '1',
  LEVEL_2 = '2',
}

export interface ICategory {
  id: string;
  parentId: string;
  name: string;
  slug?: string;
  level: CategoryLevel;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'comments',
})
export class CategoryModel
  extends Model<ICategory, Optional<ICategory, 'id'>>
  implements ICategory
{
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @AllowNull(false)
  @ForeignKey(() => CategoryModel)
  @IsUUID()
  @Column
  public parentId: string;

  @Default(false)
  @Column
  public active: boolean;

  @Length({ max: 5000 })
  @Column
  public name: string;

  @Default(CategoryLevel.LEVEL_1)
  @Column
  public level: CategoryLevel;

  @Length({ max: 255 })
  @Column
  public slug: string;

  @Column
  public createdBy: number;

  @Column
  public updatedBy: number;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;
}
