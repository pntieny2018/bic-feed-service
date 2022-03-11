import { BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { MediaModel } from './media.model';
import { CommentModel } from './comment.model';

export interface ICommentMedia {
  commentId: number;
  mediaId: number;
}
@Table({
  tableName: 'media',
})
export class CommentMediaModel extends Model implements ICommentMedia {
  @ForeignKey(() => CommentModel)
  @PrimaryKey
  @Column
  public commentId: number;

  @ForeignKey(() => MediaModel)
  @PrimaryKey
  @Column
  public mediaId: number;

  @BelongsTo(() => CommentModel)
  public comment: CommentModel;

  @BelongsTo(() => MediaModel)
  public media: MediaModel;
}
