import { IsUUID } from 'class-validator';
import { BelongsTo, Column, CreatedAt, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { PostModel } from './post.model';

export interface IUserSavePost {
  postId: string;
  userId: string;
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
}
