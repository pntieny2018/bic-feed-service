import { IsUUID } from 'class-validator';
import {
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { LinkPreviewModel } from './link-preview.model';
import { PostModel } from './post.model';

export interface IPostLinkPreview {
  postId: string;
  LinkPreviewId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
@Table({
  tableName: 'posts_link_preview',
  timestamps: false,
})
export class PostLinkPreviewModel extends Model implements IPostLinkPreview {
  @ForeignKey(() => PostModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public postId: string;

  @ForeignKey(() => LinkPreviewModel)
  @PrimaryKey
  @IsUUID()
  @Column
  public LinkPreviewId: string;

  @BelongsTo(() => PostModel)
  public post?: PostModel;

  @BelongsTo(() => LinkPreviewModel)
  public LinkPreview?: LinkPreviewModel;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;
}
