import { IsUUID } from 'class-validator';
import { Optional } from 'sequelize/types';
import {
  Column,
  CreatedAt,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

import { PostModel } from './post.model';

export interface IPostReaction {
  id: string;
  postId?: string;
  reactionName: string;
  createdBy?: string;
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

  @Column
  public reactionName: string;

  @Column
  public createdBy: string;

  @Column
  @CreatedAt
  public createdAt?: Date;
}
