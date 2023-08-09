import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { CategoryModel } from './category.model';
import { PostModel } from './post.model';

export type PostCategoryAttributes = InferAttributes<PostCategoryModel>;

@Table({
  tableName: 'posts_categories',
  timestamps: false,
})
export class PostCategoryModel extends Model<
  PostCategoryAttributes,
  InferCreationAttributes<PostCategoryModel>
> {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @ForeignKey(() => CategoryModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public categoryId: string;

  @BelongsTo(() => PostModel)
  public post?: PostModel;

  @BelongsTo(() => CategoryModel)
  public category?: CategoryModel;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;
}
