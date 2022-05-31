import { IsUUID } from 'class-validator';
import { Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { PostModel } from './post.model';

export interface IUserMarkedImportantPost {
  postId: string;
  userId: number;
}
@Table({
  tableName: 'users_mark_read_posts',
  timestamps: false,
})
export class UserMarkReadPostModel extends Model implements IUserMarkedImportantPost {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @PrimaryKey
  @Column
  public userId: number;
}
