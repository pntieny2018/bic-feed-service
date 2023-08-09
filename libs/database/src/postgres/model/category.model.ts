import { IsUUID } from 'class-validator';
import { InferCreationAttributes, InferAttributes } from 'sequelize';
import {
  AllowNull,
  Column,
  CreatedAt,
  Default,
  ForeignKey,
  HasMany,
  Length,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

import { PostCategoryModel } from './post-category.model';

export type CategoryAttributes = InferAttributes<CategoryModel>;

@Table({
  tableName: 'categories',
})
export class CategoryModel extends Model<
  CategoryAttributes,
  InferCreationAttributes<CategoryModel>
> {
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
  public isActive: boolean;

  @Length({ max: 5000 })
  @Column
  public name: string;

  @Column
  public level: number;

  @Column
  public zindex: number;

  @Length({ max: 255 })
  @Column
  public slug?: string;

  @Column
  public createdBy: string;

  @Column
  public updatedBy: string;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;

  @HasMany(() => PostCategoryModel)
  public posts?: PostCategoryModel[];
}
