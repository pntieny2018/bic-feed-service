import { IsUUID } from 'class-validator';
import {
  AllowNull,
  Column,
  CreatedAt,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { v4 } from 'uuid';
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
  @PrimaryKey
  @IsUUID()
  @Default(() => v4())
  @Column
  public id: string;

  @ForeignKey(() => PostModel)
  @IsUUID()
  @Column
  public postId: string;

  @Default(false)
  @Column
  public isExpiredProcessing: boolean;

  @AllowNull(true)
  @Column
  public reason: string;

  @AllowNull(true)
  @Column
  public postJson: string;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;
}
