import { BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { MediaModel } from './media.model';
import { PostModel } from './post.model';

export interface IPostMedia {
  postId: number;
  mediaId: number;
}
@Table({
  tableName: 'posts_media',
  timestamps: false,
})
export class PostMediaModel extends Model implements IPostMedia {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @Column
  public postId: number;

  @ForeignKey(() => MediaModel)
  @PrimaryKey
  @Column
  public mediaId: number;

  @BelongsTo(() => PostModel)
  public post: PostModel;

  @BelongsTo(() => MediaModel)
  public media: MediaModel;
}
