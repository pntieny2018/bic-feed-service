import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';

import { PostModel } from './post.model';

export type UserMarkedImportantPostAttributes = InferAttributes<UserMarkReadPostModel>;
@Table({
  tableName: 'users_mark_read_posts',
  timestamps: false,
})
export class UserMarkReadPostModel extends Model<
  UserMarkedImportantPostAttributes,
  InferCreationAttributes<UserMarkReadPostModel>
> {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @PrimaryKey
  @Column
  public userId: string;
}
