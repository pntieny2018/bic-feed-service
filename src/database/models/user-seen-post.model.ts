import { IsUUID } from 'class-validator';
import { Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { PostModel } from './post.model';

export interface IUserSeenPost {
  postId: string;
  userId: number;
}

@Table({
  tableName: 'users_seen_posts',
  timestamps: false,
})
export class UserSeenPostModel extends Model implements IUserSeenPost {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @PrimaryKey
  @Column
  public userId: number;
}
