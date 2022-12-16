import { IsUUID } from 'class-validator';
import {
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { PostModel } from './post.model';

export interface IFailedProcessPost {
  postId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'failed_process_posts',
  timestamps: false,
})
export class FailedProcessPostModel extends Model implements IFailedProcessPost {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;
}
