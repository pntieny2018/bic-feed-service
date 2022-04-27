import { Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BelongsToMany,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { CommentEditedHistoryMediaModel } from './comment-edited-history-media.model';
import { CommentModel } from './comment.model';
import { IMedia, MediaModel } from './media.model';

export interface ICommentEditedHistory {
  id: number;
  commentId: number;
  content: string;
  editedAt: Date;
  media?: IMedia[];
}

@Table({
  tableName: 'comment_edited_history',
  timestamps: false,
})
export class CommentEditedHistoryModel
  extends Model<ICommentEditedHistory, Optional<ICommentEditedHistory, 'id'>>
  implements ICommentEditedHistory
{
  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;

  @ForeignKey(() => CommentModel)
  @Column
  public commentId: number;

  @AllowNull(true)
  @Column
  public content: string;

  @AllowNull(false)
  @Column
  public editedAt: Date;

  @BelongsToMany(() => MediaModel, () => CommentEditedHistoryMediaModel)
  public media?: MediaModel[];
}
