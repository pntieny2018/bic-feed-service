import { IsUUID } from 'class-validator';
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
import { IPostGroup, PostGroupModel } from './post-group.model';
import { PostModel } from './post.model';

export interface IUserSavePost {
  postId: string;
  userId: string;
  postGroups?: IPostGroup[];
  createdAt?: Date;
}

@Table({
  tableName: 'users_save_posts',
  createdAt: true,
  updatedAt: false,
})
export class UserSavePostModel extends Model implements IUserSavePost {
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
