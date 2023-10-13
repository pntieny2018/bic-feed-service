import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { BelongsTo, Column, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

import { CommentModel } from './comment.model';
import { PostModel } from './post.model';

export enum MentionableType {
  POST = 'post',
  COMMENT = 'comment',
}

export type MentionAttributes = InferAttributes<MentionModel>;

@Table({
  tableName: 'mentions',
  timestamps: false,
})
export class MentionModel extends Model<MentionAttributes, InferCreationAttributes<MentionModel>> {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public mentionableType: MentionableType;

  @IsUUID()
  @Column
  public entityId: string;

  @Column
  public userId: string;

  @BelongsTo(() => PostModel, 'entityId')
  public post?: PostModel;

  @BelongsTo(() => CommentModel, 'entityId')
  public comment?: CommentModel;
}
