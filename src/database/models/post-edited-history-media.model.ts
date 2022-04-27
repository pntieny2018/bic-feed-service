import { BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { MediaModel } from './media.model';
import { PostEditedHistoryModel } from './post-edited-history.model';

export interface IPostEditedHistoryMedia {
  postEditedHistoryId: number;
  mediaId: number;
}

@Table({
  tableName: 'post_edited_history_media',
  timestamps: false,
})
export class PostEditedHistoryMediaModel extends Model implements IPostEditedHistoryMedia {
  @ForeignKey(() => PostEditedHistoryModel)
  @PrimaryKey
  @Column
  public postEditedHistoryId: number;

  @ForeignKey(() => MediaModel)
  @PrimaryKey
  @Column
  public mediaId: number;

  @BelongsTo(() => MediaModel)
  public media?: MediaModel;
}
