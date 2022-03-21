import { BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { MediaModel } from './media.model';
import { CommentModel } from './comment.model';

export interface ICommentMedia {
  commentId: number;
  mediaId: number;
}
@Table({
  tableName: 'comments_media',
  createdAt: false,
  updatedAt: false,
})
export class CommentMediaModel extends Model<ICommentMedia> implements ICommentMedia {
  @PrimaryKey
  @ForeignKey(() => CommentModel)
  @Column
  public commentId: number;

  @PrimaryKey
  @ForeignKey(() => MediaModel)
  @Column
  public mediaId: number;

  @BelongsTo(() => CommentModel)
  public comment: CommentModel;

  @BelongsTo(() => MediaModel)
  public media: MediaModel;
}
