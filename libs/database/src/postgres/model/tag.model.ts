import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  AllowNull,
  Column,
  CreatedAt,
  Default,
  Length,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

export type TagAttributes = InferAttributes<TagModel>;

@Table({
  tableName: 'tags',
})
export class TagModel extends Model<TagAttributes, InferCreationAttributes<TagModel>> {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public groupId: string;

  @Length({ max: 255 })
  @Column
  public name: string;

  @Length({ max: 255 })
  @Column
  public slug: string;

  @AllowNull(false)
  @Column
  public totalUsed: number;

  @AllowNull(false)
  @Column
  public createdBy: string;

  @AllowNull(false)
  @Column
  public updatedBy: string;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt: Date;
}
