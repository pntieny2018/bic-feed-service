import { Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { PostModel } from './post.model';

export interface IUserSeenPost {
  postId: number;
  userId: number;
}

@Table({
  tableName: 'users_seen_posts',
  timestamps: false,
})

export class UserSeenPostModel extends Model implements IUserSeenPost {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @Column
  public postId: number;

  @PrimaryKey
  @Column
  public userId: number;
}
