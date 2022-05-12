import { IsUUID } from 'class-validator';
import {
  Column,
  CreatedAt,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { MediaModel } from './media.model';
import { PostModel } from './post.model';
import { v4 as uuid_v4 } from 'uuid';

export interface IPostReaction {
  id: string;
  postId?: string;
  reactionName: string;
  createdBy?: number;
  createdAt?: Date;
}
@Table({
  tableName: 'posts_reactions',
  updatedAt: false,
})
export class PostReactionModel
  extends Model<IPostReaction, Optional<IPostReaction, 'id'>>
  implements IPostReaction
{
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @ForeignKey(() => PostModel)
  @IsUUID()
  @Column
  public postId: string;

  @ForeignKey(() => MediaModel)
  @Column
  public reactionName: string;

  @Column
  public createdBy: number;

  @Column
  @CreatedAt
  public createdAt?: Date;
}
