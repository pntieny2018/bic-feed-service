import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';

import { CommentModel } from './comment.model';
import { MediaModel } from './media.model';

export type CommentMediaAttributes = InferAttributes<CommentMediaModel>;

@Table({
  tableName: 'comments_media',
  createdAt: false,
  updatedAt: false,
})
export class CommentMediaModel extends Model<
  CommentMediaAttributes,
  InferCreationAttributes<CommentMediaModel>
> {
  @PrimaryKey
  @ForeignKey(() => CommentModel)
  @IsUUID()
  @Column
  public commentId: string;

  @PrimaryKey
  @ForeignKey(() => MediaModel)
  @IsUUID()
  @Column
  public mediaId: string;

  @BelongsTo(() => CommentModel)
  public comment: CommentModel;

  @BelongsTo(() => MediaModel)
  public media: MediaModel;
}
