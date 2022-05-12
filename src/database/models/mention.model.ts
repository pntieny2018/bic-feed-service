import { PostModel } from './post.model';
import { CommentModel } from './comment.model';
import { MentionableType } from '../../common/constants';
import { AutoIncrement, BelongsTo, Column, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { IsUUID } from 'class-validator';

export interface IMention {
  id?: number;
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
  @AutoIncrement
  @Column
  public id: number;

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
