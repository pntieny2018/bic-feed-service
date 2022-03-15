import { DataTypes, Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  Default,
  HasMany,
  Length,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { UserDto } from 'src/modules/auth';
import { CommentModel } from './comment.model';
import { MediaModel } from './media.model';
import { PostMediaModel } from './post-media.model';

export interface IPost {
  id: number;
  createdBy: number;
  updatedBy: number;
  content: string;
  isImportant: boolean;
  importantExpiredAt?: Date;
  isDraft: boolean;
  canReact: boolean;
  canShare: boolean;
  canComment: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  comments: CommentModel[];
  mediaList: PostMediaModel[];
}
@Table({
  tableName: 'posts',
})
export class PostModel extends Model<IPost, Optional<IPost, 'id'>> implements IPost {
  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;

  @Default(false)
  @Column
  public isImportant: boolean;

  @Column
  public importantExpiredAt?: Date;

  @Column
  public isDraft: boolean;

  @Column
  public canComment: boolean;

  @Column
  public canReact: boolean;

  @Column
  public canShare: boolean;

  @AllowNull(false)
  @Length({ max: 5000 })
  @Column
  public content: string;

  @AllowNull(false)
  @Column
  public createdBy: number;

  @AllowNull(false)
  @Column
  public updatedBy: number;

  @CreatedAt
  public createdAt: Date;

  @UpdatedAt
  public updatedAt: Date;

  @HasMany(() => CommentModel)
  public comments: CommentModel[];

  @HasMany(() => PostMediaModel)
  public mediaList: PostMediaModel[];

  @Column({
    type: DataTypes.JSONB,
  })
  public mentions: UserDto[];
}
