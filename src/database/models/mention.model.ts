import { PostModel } from './post.model';
import { CommentModel } from './comment.model';
import { MentionableType } from '../../common/constants';
import { BelongsTo, Column, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';

export interface IMention {
  id?: string;
  mentionableType: MentionableType;
  entityId: string;
  userId: number;
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
  public userId: number;

  @BelongsTo(() => PostModel, 'entityId')
  public post?: PostModel;

  @BelongsTo(() => CommentModel, 'entityId')
  public comment?: CommentModel;
}
