import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
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

export type FailedProcessPostAttributes = InferAttributes<FailedProcessPostModel>;

@Table({
  tableName: 'failed_process_posts',
  timestamps: false,
})
export class FailedProcessPostModel extends Model<
  FailedProcessPostAttributes,
  InferCreationAttributes<FailedProcessPostModel>
> {
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
