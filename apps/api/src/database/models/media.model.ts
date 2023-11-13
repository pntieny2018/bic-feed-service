import { IsUUID } from 'class-validator';
import { DataTypes, Optional } from 'sequelize';
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

import { ThumbnailDto } from '../../modules/post/dto/responses/process-video-response.dto';

import { CommentModel } from './comment.model';
import { PostModel } from './post.model';

export enum MediaType {
  VIDEO = 'video',
  IMAGE = 'image',
  FILE = 'file',
}
export enum MediaMarkAction {
  USED,
  DELETE,
}

export enum MediaStatus {
  WAITING_PROCESS = 'waiting_process',
  PROCESSING = 'processing',
  COMPLETED = 'DONE',
  FAILED = 'ERROR',
}

export interface IMedia {
  id: string;
  createdBy: string;
  url: string;
  type: MediaType;
  posts?: PostModel[];
  comments?: CommentModel[];
  createdAt?: Date;
  name: string;
  originName?: string;
  width?: number;
  height?: number;
  extension?: string;
  status: MediaStatus;
  size?: number;
  mimeType?: string;
  thumbnails?: {
    width: number;
    height: number;
    url: string;
  }[];
}
@Table({
  tableName: 'media',
  createdAt: true,
  updatedAt: false,
})
export class MediaModel extends Model<IMedia, Optional<IMedia, 'id'>> implements IMedia {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public url: string;

  @Column
  public type: MediaType;

  @AllowNull(false)
  @Column
  public createdBy: string;

  @CreatedAt
  public createdAt: Date;

  @HasMany(() => PostModel, {
    foreignKey: 'cover',
  })
  public postCovers: PostModel[];

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

  @Column
  public status: MediaStatus;

  @Default(0)
  @Column
  public size?: number;

  @Column
  public mimeType?: string;

  @Column({
    type: DataTypes.JSONB,
  })
  public thumbnails: ThumbnailDto[];
}
