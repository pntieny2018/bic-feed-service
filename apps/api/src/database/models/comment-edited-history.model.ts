import { IsUUID } from 'class-validator';
import { DataTypes, Optional } from 'sequelize';
import { AllowNull, AutoIncrement, Column, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { CommentResponseDto } from '../../modules/comment/dto/response';

export interface ICommentEditedHistory {
  id: number;
  commentId: string;
  editedAt: Date;
  oldData: CommentResponseDto;
  newData: CommentResponseDto;
}

@Table({
  tableName: 'comment_edited_history',
  timestamps: false,
})
export class CommentEditedHistoryModel
  extends Model<ICommentEditedHistory, Optional<ICommentEditedHistory, 'id'>>
  implements ICommentEditedHistory
{
  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;

  @IsUUID()
  @Column
  public commentId: string;

  @AllowNull(false)
  @Column
  public editedAt: Date;

  @AllowNull(true)
  @Column({
    type: DataTypes.JSONB,
  })
  public oldData: any;

  @AllowNull(false)
  @Column({
    type: DataTypes.JSONB,
  })
  public newData: any;
}
