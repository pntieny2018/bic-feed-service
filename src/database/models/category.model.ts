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
import { Optional } from 'sequelize';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';
import { IPost, PostModel } from './post.model';
import { PostCategoryModel } from './post-category.model';

export interface ICategory {
  id: string;
  parentId: string;
  name: string;
  slug?: string;
  level: number;
  zindex: number;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
  posts?: IPost[];
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
  public slug: string;

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
  public posts: PostModel[];
}
