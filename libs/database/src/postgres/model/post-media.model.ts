import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';

import { MediaModel } from './media.model';
import { PostModel } from './post.model';

export type PostMediaAttributes = InferAttributes<PostMediaModel>;
@Table({
  tableName: 'posts_media',
  timestamps: false,
})
export class PostMediaModel extends Model<
  PostMediaAttributes,
  InferCreationAttributes<PostMediaModel>
> {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @ForeignKey(() => MediaModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public mediaId: string;

  @BelongsTo(() => PostModel)
  public post?: PostModel;

  @BelongsTo(() => MediaModel)
  public media?: MediaModel;
}
