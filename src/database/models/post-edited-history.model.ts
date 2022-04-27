import { DataTypes, Optional } from 'sequelize';
import { AllowNull, AutoIncrement, Column, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { PostResponseDto } from '../../modules/post/dto/responses';

export interface IPostEditedHistory {
  id: number;
  postId: number;
  editedAt: Date;
  oldData: PostResponseDto;
  newData: PostResponseDto;
}

@Table({
  tableName: 'post_edited_history',
  timestamps: false,
})
export class PostEditedHistoryModel
  extends Model<IPostEditedHistory, Optional<IPostEditedHistory, 'id'>>
  implements IPostEditedHistory
{
  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;

  @Column
  public postId: number;

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
