import {
  AllowNull,
  Column,
  CreatedAt,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { IsUUID } from 'class-validator';
import { v4 as uuid_v4 } from 'uuid';

export interface ILinkPreview {
  id: string;
  url: string;
  domain?: string;
  image?: string;
  title?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'link_preview',
})
export class LinkPreviewModel
  extends Model<ILinkPreview, Optional<ILinkPreview, 'id'>>
  implements ILinkPreview
{
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public url: string;

  @AllowNull(true)
  @Column
  public domain: string;

  @AllowNull(true)
  @Column
  public image: string;

  @AllowNull(true)
  @Column
  public title: string;

  @AllowNull(true)
  @Column
  public description: string;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;
}
