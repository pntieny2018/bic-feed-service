import { BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { CommentEditedHistoryModel } from './comment-edited-history.model';
import { MediaModel } from './media.model';

export interface ICommentEditedHistoryMedia {
  commentEditedHistoryId: number;
  mediaId: number;
}

@Table({
  tableName: 'comment_edited_history_media',
  timestamps: false,
})
export class CommentEditedHistoryMediaModel extends Model implements ICommentEditedHistoryMedia {
  @ForeignKey(() => CommentEditedHistoryModel)
  @PrimaryKey
  @Column
  public commentEditedHistoryId: number;

  @ForeignKey(() => MediaModel)
  @PrimaryKey
  @Column
  public mediaId: number;

  @BelongsTo(() => MediaModel)
  public media?: MediaModel;
}
