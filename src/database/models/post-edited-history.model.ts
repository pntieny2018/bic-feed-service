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
import { IMedia, MediaModel } from './media.model';
import { PostEditedHistoryMediaModel } from './post-edited-history-media.model';
import { PostModel } from './post.model';

export interface IPostEditedHistory {
  id: number;
  postId: number;
  content: string;
  editedAt: Date;
  media?: IMedia[];
}

@Table({
  tableName: 'post_edited_history',
  timestamps: false,
})
export class PostEditedHistoryModel
  extends Model<IPostEditedHistory, Optional<IPostEditedHistory, 'id'>>
  implements IPostEditedHistory
{
  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;

  @ForeignKey(() => PostModel)
  @Column
  public postId: number;

  @AllowNull(true)
  @Column
  public content: string;

  @AllowNull(false)
  @Column
  public editedAt: Date;

  @BelongsToMany(() => MediaModel, () => PostEditedHistoryMediaModel)
  public media?: MediaModel[];
}
