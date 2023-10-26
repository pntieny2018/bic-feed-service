import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  Column,
  CreatedAt,
  Default,
  PrimaryKey,
  Table,
  UpdatedAt,
  Model,
} from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

export type ReactionContentDetailsAttributes = InferAttributes<ReactionContentDetailsModel>;

@Table({
  tableName: 'reaction_content_details',
  timestamps: false,
})
export class ReactionContentDetailsModel extends Model<
  ReactionContentDetailsAttributes,
  InferCreationAttributes<ReactionContentDetailsModel>
> {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public reactionName: string;

  @IsUUID()
  @Column
  public contentId: string;

  @Column
  public count: number;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt: Date;
}
