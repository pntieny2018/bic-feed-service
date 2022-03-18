import { MentionableType } from './../../common/constants/model.constant';
import { MentionModel } from './mention.model';
import {
  DataTypes,
  Optional,
  BelongsToManyAddAssociationsMixin,
  HasManyAddAssociationMixin,
  HasManySetAssociationsMixin,
  HasManyAddAssociationsMixin,
} from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BelongsToMany,
  Column,
  CreatedAt,
  Default,
  HasMany,
  Length,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
  Sequelize,
} from 'sequelize-typescript';
import { UserDto } from 'src/modules/auth';
import { CommentModel } from './comment.model';
import { MediaModel } from './media.model';
import { PostMediaModel } from './post-media.model';
import { UserNewsFeedModel } from './user-newsfeed.model';
import { PostGroupModel } from './post-group.model';
import { PostReactionModel } from './post-reaction.model';
import { StringHelper } from 'src/common/helpers';
import { getDatabaseConfig } from 'src/config/database';
import { Literal } from 'sequelize/types/utils';
import sequelize from 'sequelize';

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
  comments?: CommentModel[];
  media?: MediaModel[];
  groups?: PostGroupModel[];
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

  @AllowNull(true)
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
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt: Date;

  @HasMany(() => CommentModel)
  public comments?: CommentModel[];

  @BelongsToMany(() => MediaModel, () => PostMediaModel)
  public media?: MediaModel[];

  @HasMany(() => MentionModel, {
    foreignKey: 'entityId',
    constraints: false,
    scope: {
      [StringHelper.camelToSnakeCase('mentionableType')]: MentionableType.POST,
    },
  })
  public mentions?: MentionModel[];

  @HasMany(() => UserNewsFeedModel, {
    foreignKey: 'postId',
  })
  public userNewsFeeds: UserNewsFeedModel[];

  @HasMany(() => PostGroupModel, {
    as: 'audienceGroup',
    foreignKey: 'postId',
  })
  @HasMany(() => PostGroupModel, {
    as: 'belongToGroup',
    foreignKey: 'postId',
  })
  public postGroups: PostGroupModel[];

  @HasMany(() => PostReactionModel)
  public postReactions: PostReactionModel[];

  public addMedia!: BelongsToManyAddAssociationsMixin<MediaModel, number>;

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
                                           COUNT(${schema}.post_reaction.id ) as TT,
                                           ${schema}.post_reaction.reaction_name as RN,
                                           MIN(${schema}.post_reaction.created_at) as minDate
                                       FROM   ${schema}.post_reaction
                                       WHERE  ${schema}.post_reaction.post_id = "PostModel"."id"
                                       GROUP BY ${schema}.post_reaction.reaction_name
                                       ORDER BY minDate ASC
                               ) as orderBefore
                       ) AS RC
                  GROUP BY 1
               )`),
      alias ? alias : 'reactionsCount',
    ];
  }

  public static loadCommentsCount(alias?: string): [Literal, string] {
    const { schema } = getDatabaseConfig();
    return [
      Sequelize.literal(
        `(SELECT COUNT(*) FROM ${schema}.comments WHERE ${schema}.comments.post_id="PostModel"."id")`
      ),
      alias ?? 'commentsCount',
    ];
  }

  public static importantPostsFirstCondition(): [Literal, string] {
    return [
      sequelize.literal(`CASE WHEN "PostModel"."important_expired_at" > NOW() THEN 0 ELSE 1 END`),
      'importantFirst',
    ];
  }
}
