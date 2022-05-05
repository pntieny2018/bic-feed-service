import {
  AfterCreate,
  AfterDestroy,
  AllowNull,
  AutoIncrement,
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  Default,
  ForeignKey,
  HasMany,
  Length,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Sequelize } from 'sequelize';
import { Literal } from 'sequelize/types/utils';
import { IPost, PostModel } from './post.model';
import { IMedia, MediaModel } from './media.model';
import { StringHelper } from '../../common/helpers';
import { IMention, MentionModel } from './mention.model';
import { UserDataShareDto } from '../../shared/user/dto';
import { MentionableType } from '../../common/constants';
import { getDatabaseConfig } from '../../config/database';
import { CommentMediaModel } from './comment-media.model';
import { CommentReactionModel } from './comment-reaction.model';
import { BelongsToManyAddAssociationsMixin, Optional } from 'sequelize';

export enum ActionEnum {
  INCREMENT = 'increment',
  DECREMENT = 'decrement',
}

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
  totalReply?: number;
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

  @AllowNull(true)
  @ForeignKey(() => CommentModel)
  @Default(0)
  @Column
  public parentId: number;

  @ForeignKey(() => PostModel)
  @AllowNull(false)
  @Column
  public postId: number;

  @Length({ max: 5000 })
  @Column
  public content: string;

  @Column
  public totalReply?: number;

  @Column
  public createdBy: number;

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
  public mentions: MentionModel[] = [];

  @HasMany(() => CommentModel, {
    foreignKey: {
      allowNull: true,
    },
  })
  public child?: CommentModel[];

  @HasMany(() => CommentReactionModel)
  public ownerReactions: CommentReactionModel[];

  public reactionsCount: string;

  /**
   * load reactions count to comment
   * @param alias String
   */
  public static loadReactionsCount(alias = 'reactionsCount'): [Literal, string] {
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
      alias,
    ];
  }

  @AfterCreate
  public static async onCommentCreated(comment: CommentModel): Promise<void> {
    await CommentModel._updateCommentCountForPost(
      comment.sequelize,
      comment.postId,
      ActionEnum.INCREMENT
    );
    await CommentModel._updateChildCommentCount(comment, ActionEnum.INCREMENT);
  }

  @AfterDestroy
  public static async onCommentDeleted(comment: CommentModel): Promise<void> {
    await CommentModel._updateCommentCountForPost(
      comment.sequelize,
      comment.postId,
      ActionEnum.DECREMENT
    );
    await CommentModel._updateChildCommentCount(comment, ActionEnum.DECREMENT);
  }

  /**
   * Update Child Comment Count
   * @param comment CommentModel
   * @param action ActionEnum
   * @private
   */
  private static async _updateChildCommentCount(
    comment: CommentModel,
    action: ActionEnum
  ): Promise<void> {
    if (comment.parentId && comment.parentId > 0) {
      const parentComment = await comment.sequelize
        .model(CommentModel.name)
        .findByPk(comment.parentId);
      await parentComment[action]('totalReply');
    }
  }

  /**
   * Update Comment Count For Post
   * @param sequelize Sequelize
   * @param postId Number
   * @param action ActionEnum
   * @private
   */
  private static async _updateCommentCountForPost(
    sequelize: Sequelize,
    postId: number,
    action: ActionEnum
  ): Promise<void> {
    const post = await sequelize.model(PostModel.name).findByPk(postId);
    if (post) {
      await post[action]('comments_count');
    }
  }
}
