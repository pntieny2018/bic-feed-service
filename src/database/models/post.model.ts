import { MentionableType } from './../../common/constants/model.constant';
import { MentionModel } from './mention.model';
import {
  DataTypes,
  Optional,
  BelongsToManyAddAssociationsMixin,
  HasManyAddAssociationMixin,
  HasManySetAssociationsMixin,
  HasManyAddAssociationsMixin,
  BelongsToManySetAssociationsMixin,
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
import { CommentModel } from './comment.model';
import { MediaModel } from './media.model';
import { PostMediaModel } from './post-media.model';
import { UserNewsFeedModel } from './user-newsfeed.model';
import { PostGroupModel } from './post-group.model';
import { PostReactionModel } from './post-reaction.model';
import { Literal } from 'sequelize/types/utils';
import sequelize from 'sequelize';
import { StringHelper } from '../../common/helpers';
import { getDatabaseConfig } from '../../config/database';

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
  mentions?: MentionModel[];
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

  public addMedia?: BelongsToManyAddAssociationsMixin<MediaModel, number>;

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

  @HasMany(() => PostReactionModel, {
    as: 'ownerReactions',
    foreignKey: 'postId',
  })
  public postReactions: PostReactionModel[];

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
                                           COUNT(${schema}.posts_reactions.id ) as TT,
                                           ${schema}.posts_reactions.reaction_name as RN,
                                           MIN(${schema}.posts_reactions.created_at) as minDate
                                       FROM   ${schema}.posts_reactions
                                       WHERE  ${schema}.posts_reactions.post_id = "PostModel"."id"
                                       GROUP BY ${schema}.posts_reactions.reaction_name
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

  public static importantPostsFirstCondition(alias?: string): [Literal, string] {
    return [
      sequelize.literal(`CASE WHEN "PostModel"."important_expired_at" > NOW() THEN 1 ELSE 0 END`),
      alias ?? 'isNowImportant',
    ];
  }

  public static parseAggregatedReaction(value: string): Record<string, Record<string, number>> {
    if (value && value !== '1=') {
      const rawReactionsCount: string = (value as string).substring(1);
      const [s1, s2] = rawReactionsCount.split('=');
      const reactionsName = s1.split(',');
      const total = s2.split(',');
      const reactionsCount = {};
      reactionsName.forEach((v, i) => (reactionsCount[i] = { [v]: parseInt(total[i]) }));
      return reactionsCount;
    }
    return null;
  }
}
