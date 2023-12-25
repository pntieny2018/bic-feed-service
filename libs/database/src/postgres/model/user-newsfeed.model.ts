import { IsUUID } from 'class-validator';
import { DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  AllowNull,
  BelongsTo,
  Column,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import { PostModel } from './post.model';
import { CONTENT_TYPE } from '@beincom/constants';
import {
  UserSavePostAttributes,
  UserSavePostModel,
} from '@libs/database/postgres/model/user-save-post.model';
import { UserMarkReadPostModel } from '@libs/database/postgres/model/user-mark-read-post.model';

export type UserNewsFeedAttributes = InferAttributes<UserNewsFeedModel>;
@Table({
  tableName: 'user_newsfeed',
  updatedAt: false,
})
export class UserNewsFeedModel extends Model<
  UserNewsFeedAttributes,
  InferCreationAttributes<UserNewsFeedModel>
> {
  @PrimaryKey
  @Column
  public userId: string;

  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @Default(false)
  @Column
  public isSeenPost: boolean;

  @AllowNull(false)
  @Column({
    type: DataTypes.STRING,
  })
  public type: CONTENT_TYPE;

  @AllowNull(false)
  @Column
  public publishedAt: Date;

  @AllowNull(true)
  @Default(false)
  @Column
  public isImportant: boolean;

  @AllowNull(false)
  @Column
  public createdBy: string;

  @BelongsTo(() => PostModel)
  public postModel: PostModel;

  @HasMany(() => UserMarkReadPostModel, 'postId')
  public userMarkReadImportant?: UserMarkReadPostModel[];

  @HasMany(() => UserSavePostModel, 'postId')
  public userSavePosts?: UserSavePostModel[];
}
