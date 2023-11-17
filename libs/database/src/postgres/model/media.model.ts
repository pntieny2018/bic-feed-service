import { MEDIA_PROCESS_STATUS, MEDIA_TYPE } from '@beincom/constants';
import { IsUUID } from 'class-validator';
import { DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  AllowNull,
  Column,
  CreatedAt,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

import { CommentMediaModel } from './comment-media.model';
import { CommentModel } from './comment.model';
import { PostMediaModel } from './post-media.model';
import { PostModel } from './post.model';

export enum MediaMarkAction {
  USED,
  DELETE,
}

export interface IThumbnail {
  width: number;
  height: number;
  url: string;
}

export type MediaAttributes = InferAttributes<MediaModel>;

@Table({
  tableName: 'media',
  createdAt: true,
  updatedAt: false,
})
export class MediaModel extends Model<MediaAttributes, InferCreationAttributes<MediaModel>> {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public url: string;

  @Column({
    type: DataTypes.STRING,
  })
  public type: MEDIA_TYPE;

  @AllowNull(false)
  @Column
  public createdBy: string;

  @CreatedAt
  public createdAt?: Date;

  @HasMany(() => PostMediaModel)
  public posts?: PostModel[];

  @HasMany(() => CommentMediaModel)
  public comments?: CommentModel[];

  @HasMany(() => PostModel, {
    foreignKey: 'cover',
  })
  public postCovers?: PostModel[];

  @Column
  public name: string;

  @Column
  public originName?: string;

  @Default(0)
  @Column
  public width?: number;

  @Default(0)
  @Column
  public height?: number;

  @Column
  public extension?: string;

  @Column({
    type: DataTypes.STRING,
  })
  public status: MEDIA_PROCESS_STATUS;

  @Default(0)
  @Column
  public size?: number;

  @Column
  public mimeType?: string;

  @Column({
    type: DataTypes.JSONB,
  })
  public thumbnails?: IThumbnail[];
}
