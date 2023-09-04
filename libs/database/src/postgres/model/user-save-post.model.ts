import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import { PostGroupModel } from './post-group.model';
import { PostModel } from './post.model';

export type UserSavePostAttributes = InferAttributes<UserSavePostModel>;

@Table({
  tableName: 'users_save_posts',
  createdAt: true,
  updatedAt: false,
})
export class UserSavePostModel extends Model<
  UserSavePostAttributes,
  InferCreationAttributes<UserSavePostModel>
> {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @PrimaryKey
  @Column
  public userId: string;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @BelongsTo(() => PostModel)
  public post?: PostModel;

  @HasMany(() => PostGroupModel, {
    foreignKey: 'postId',
    sourceKey: 'postId',
    as: 'postGroups',
    constraints: false,
  })
  public postGroups?: PostGroupModel[];
}
