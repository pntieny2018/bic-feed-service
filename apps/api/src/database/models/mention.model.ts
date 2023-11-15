import { IsUUID } from 'class-validator';
import { BelongsTo, Column, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

import { CommentModel } from './comment.model';
import { PostModel } from './post.model';

export enum MentionableType {
  POST = 'post',
  COMMENT = 'comment',
}

export interface IMention {
  id?: string;
  mentionableType: MentionableType;
  entityId: string;
  userId: string;
  post?: PostModel;
  comment?: CommentModel;
}
@Table({
  tableName: 'mentions',
  timestamps: false,
})
export class MentionModel extends Model<IMention, Omit<IMention, 'id'>> implements IMention {
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
