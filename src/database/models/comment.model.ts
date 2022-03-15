import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  ForeignKey,
  HasMany,
  Length,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { PostModel } from './post.model';
import { BelongsToManyAddAssociationsMixin, Optional } from 'sequelize';
import { CommentMediaModel } from './comment-media.model';
import { MediaModel } from './media.model';
import { ApiProperty } from '@nestjs/swagger';
import { MentionModel } from './mention.model';
import { MentionableType } from '../../common/constants';

export interface IComment {
  id: number;
  postId: number;
  parentId?: number;
  content?: string;
  createdBy: number;
  updatedBy: number;
  createdAt?: Date;
  updatedAt?: Date;
  post: PostModel;
  media?: MediaModel[];
}

@Table({
  tableName: 'comments',
})
export class CommentModel extends Model<IComment, Optional<IComment, 'id'>> implements IComment {
  @PrimaryKey
  @AutoIncrement
  @Column
  @ApiProperty()
  public id: number;

  @Column
  @ApiProperty()
  public parentId: number;

  @ForeignKey(() => PostModel)
  @AllowNull(false)
  @Column
  @ApiProperty()
  public postId: number;

  @Length({ max: 5000 })
  @Column
  @ApiProperty()
  public content: string;

  @AllowNull(false)
  @Column
  @ApiProperty()
  public createdBy: number;

  @AllowNull(false)
  @Column
  @ApiProperty()
  public updatedBy: number;

  @CreatedAt
  @Column
  @ApiProperty()
  public createdAt?: Date;

  @UpdatedAt
  @Column
  @ApiProperty()
  public updatedAt?: Date;

  @BelongsTo(() => PostModel)
  @ApiProperty()
  public post: PostModel;

  @BelongsToMany(() => MediaModel, () => CommentMediaModel)
  @ApiProperty()
  public media?: MediaModel[];

  public addMedia!: BelongsToManyAddAssociationsMixin<MediaModel, number>;

  @HasMany(() => MentionModel, {
    foreignKey: 'entityId',
    constraints: false,
    scope: {
      mentionableType: MentionableType.COMMENT,
    },
  })
  public mentions: MentionModel[];
}
