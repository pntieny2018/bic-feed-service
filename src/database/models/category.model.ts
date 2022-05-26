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

export interface ICategory {
  id: string;
  parentId: string;
  name: string;
  slug?: string;
  level: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'categories',
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

  @Default(true)
  @Column
  public active: boolean;

  @Length({ max: 5000 })
  @Column
  public name: string;

  @Column
  public level: number;

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
