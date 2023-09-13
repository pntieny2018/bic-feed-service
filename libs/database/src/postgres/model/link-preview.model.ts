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

export type LinkPreviewAttributes = InferAttributes<LinkPreviewModel>;

@Table({
  tableName: 'link_preview',
})
export class LinkPreviewModel extends Model<
  LinkPreviewAttributes,
  InferCreationAttributes<LinkPreviewModel>
> {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Length({ max: 2048 })
  @Column
  public url: string;

  @Length({ max: 255 })
  @AllowNull(true)
  @Column
  public domain?: string;

  @Length({ max: 2048 })
  @AllowNull(true)
  @Column
  public image?: string;

  @Length({ max: 255 })
  @AllowNull(true)
  @Column
  public title?: string;

  @Length({ max: 255 })
  @AllowNull(true)
  @Column
  public description?: string;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt: Date;
}
