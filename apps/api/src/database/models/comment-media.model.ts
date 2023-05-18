import { BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { MediaModel } from './media.model';
import { CommentModel } from './comment.model';
import { IsUUID } from 'class-validator';

export interface ICommentMedia {
  commentId: string;
  mediaId: string;
}
@Table({
  tableName: 'comments_media',
  createdAt: false,
  updatedAt: false,
})
export class CommentMediaModel extends Model<ICommentMedia> implements ICommentMedia {
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
