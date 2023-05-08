import { IsUUID } from 'class-validator';
import { BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { MediaModel } from './media.model';
import { PostModel } from './post.model';

export interface IPostMedia {
  postId: string;
  mediaId: string;
}
@Table({
  tableName: 'posts_media',
  timestamps: false,
})
export class PostMediaModel extends Model implements IPostMedia {
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
