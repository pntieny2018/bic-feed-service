import { CONTENT_TARGET } from '@beincom/constants';
import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  BelongsTo,
  Column,
  CreatedAt,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

import { PostAttributes, PostModel } from './post.model';

export type PostReactionAttributes = InferAttributes<PostReactionModel>;
@Table({
  tableName: 'posts_reactions',
  updatedAt: false,
})
export class PostReactionModel extends Model<
  PostReactionAttributes,
  InferCreationAttributes<PostReactionModel>
> {
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

  @BelongsTo(() => PostModel)
  public post?: PostAttributes;

  public target?: CONTENT_TARGET;
}
