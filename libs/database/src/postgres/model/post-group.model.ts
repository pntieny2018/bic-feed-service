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

import { PostModel } from './post.model';

export type PostGroupAttributes = InferAttributes<PostGroupModel>;

@Table({
  tableName: 'posts_groups',
})
export class PostGroupModel extends Model<
  PostGroupAttributes,
  InferCreationAttributes<PostGroupModel>
> {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @PrimaryKey
  @Column
  public groupId: string;

  @BelongsTo(() => PostModel)
  public post?: PostModel;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;

  @Column
  public isArchived?: boolean;

  @Column
  public isPinned?: boolean;

  @Column
  public pinnedIndex?: number;
}
