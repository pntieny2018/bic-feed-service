import { Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { PostModel } from './post.model';

export interface IUserMarkedImportantPost {
  postId: number;
  userId: number;
}
@Table({
  tableName: 'users_mark_read_posts',
  timestamps: false,
})
export class UserMarkReadPostModel extends Model implements IUserMarkedImportantPost {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @Column
  public postId: number;

  @PrimaryKey
  @Column
  public userId: number;
}
