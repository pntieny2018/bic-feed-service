import { PostModel } from './post.model';
import { CommentModel } from './comment.model';
import { MentionableType } from '../../common/constants';
import { AutoIncrement, BelongsTo, Column, Model, PrimaryKey } from 'sequelize-typescript';

export interface IMention {
  id: number;
  mentionableType: MentionableType;
  entityId: number;
  userId: number;
  post?: PostModel;
  comment?: CommentModel;
}
export class MentionModel extends Model<IMention, Omit<IMention, 'id'>> implements IMention {
  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;

  public mentionableType: MentionableType;

  public entityId: number;

  public userId: number;

  @BelongsTo(() => PostModel)
  public post?: PostModel;

  @BelongsTo(() => CommentModel)
  public comment?: CommentModel;
}
