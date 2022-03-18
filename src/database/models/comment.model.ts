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
  Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { IPost, PostModel } from './post.model';
import { IMedia, MediaModel } from './media.model';
import { IMention, MentionModel } from './mention.model';
import { Literal } from 'sequelize/types/utils';
import { StringHelper } from '../../common/helpers';
import { MentionableType } from '../../common/constants';
import { CommentMediaModel } from './comment-media.model';
import { CommentReactionModel } from './comment-reaction.model';
import { BelongsToManyAddAssociationsMixin, Optional } from 'sequelize';
import { getDatabaseConfig } from '../../config/database';
import { UserDataShareDto } from '../../shared/user/dto';

export interface IComment {
  id: number;
  actor: UserDataShareDto;
  postId: number;
  parentId?: number;
  content?: string;
  createdBy: number;
  updatedBy: number;
  createdAt?: Date;
  updatedAt?: Date;
  post: IPost;
  media?: IMedia[];
  mentions?: IMention[];
  child?: IComment[];
  reactionsCount?: string;
}

@Table({
  tableName: 'comments',
})
export class CommentModel extends Model<IComment, Optional<IComment, 'id'>> implements IComment {
  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;

  public actor: UserDataShareDto;

  @ForeignKey(() => CommentModel)
  @Column
  public parentId: number;

  @ForeignKey(() => PostModel)
  @AllowNull(false)
  @Column
  public postId: number;

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
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;

  @BelongsTo(() => PostModel)
  public post: PostModel;

  @BelongsToMany(() => MediaModel, () => CommentMediaModel)
  public media?: MediaModel[];

  public addMedia!: BelongsToManyAddAssociationsMixin<MediaModel, number>;

  @HasMany(() => MentionModel, {
    foreignKey: 'entityId',
    constraints: false,
    scope: {
      [StringHelper.camelToSnakeCase('mentionableType')]: MentionableType.COMMENT,
    },
  })
  public mentions: MentionModel[];

  @HasMany(() => CommentModel)
  public child?: CommentModel[];

  @HasMany(() => CommentReactionModel)
  public ownerReactions: CommentReactionModel[];

  public reactionsCount: string;

  /**
   * load reactions count to comment
   * @param alias String
   */
  public static loadReactionsCount(alias?: string): [Literal, string] {
    const { schema } = getDatabaseConfig();
    return [
      Sequelize.literal(`(
                  SELECT concat(1,reaction_name_list,'=',total_list) FROM (
                         SELECT  
                               1,
                               string_agg(RN,',') AS reaction_name_list,
                               string_agg(cast(TT as varchar),',') AS total_list 
                               FROM (
                                       SELECT 
                                           COUNT(${schema}.comments_reactions.id ) as TT,
                                           ${schema}.comments_reactions.reaction_name as RN,
                                           MIN(${schema}.comments_reactions.created_at) as minDate
                                       FROM   ${schema}.comments_reactions
                                       WHERE  ${schema}.comments_reactions.comment_id = "CommentModel"."id"
                                       GROUP BY ${schema}.comments_reactions.reaction_name
                                       ORDER BY minDate ASC
                               ) as orderBefore
                       ) AS RC
                  GROUP BY 1
               )`),
      alias ? alias : 'reactionsCount',
    ];
  }
}
