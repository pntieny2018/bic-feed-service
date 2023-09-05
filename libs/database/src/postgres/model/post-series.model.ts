import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { PostModel } from './post.model';

export type PostSeriesAttributes = InferAttributes<PostSeriesModel>;

@Table({
  tableName: 'posts_series',
  timestamps: false,
})
export class PostSeriesModel extends Model<
  PostSeriesAttributes,
  InferCreationAttributes<PostSeriesModel>
> {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public seriesId: string;

  @Column
  public zindex?: number;

  @BelongsTo(() => PostModel, 'postId')
  public post?: PostModel;

  @BelongsTo(() => PostModel, 'seriesId')
  public series?: PostModel;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;
}
