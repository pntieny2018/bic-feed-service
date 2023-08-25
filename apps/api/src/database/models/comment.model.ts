import { ORDER } from '@beincom/constants';
import { IsUUID } from 'class-validator';
import { DataTypes, Optional, QueryTypes, Sequelize } from 'sequelize';
import { Literal } from 'sequelize/types/utils';
import {
  AfterCreate,
  AfterDestroy,
  AllowNull,
  BelongsTo,
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
import { NIL, NIL as NIL_UUID, v4 as uuid_v4 } from 'uuid';

import { getDatabaseConfig } from '../../config/database';
import { GetCommentsDto } from '../../modules/comment/dto/requests';
import { TargetType } from '../../modules/report-content/contstants';
import { UserDto } from '../../modules/v2-user/application';

import { CommentReactionModel, ICommentReaction } from './comment-reaction.model';
import { IMedia } from './media.model';
import { IPost, PostModel } from './post.model';
import { ReportContentDetailModel } from './report-content-detail.model';

export enum ActionEnum {
  INCREMENT = 'increment',
  DECREMENT = 'decrement',
}

export interface IComment {
  id: string;
  actor: UserDto;
  postId: string;
  parentId?: string;
  edited?: boolean;
  parent?: IComment;
  content?: string;
  giphyId?: string;
  isHidden?: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
  post: IPost;
  media?: IMedia[];
  child?: IComment[];
  totalReply?: number;
  reactionsCount?: string;
  mediaJson?: any;
  mentions?: string[];
  ownerReactions?: ICommentReaction[];
}

@Table({
  tableName: 'comments',
})
export class CommentModel extends Model<IComment, Optional<IComment, 'id'>> implements IComment {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  public actor: UserDto;

  @AllowNull(false)
  @ForeignKey(() => CommentModel)
  @IsUUID()
  @Column
  public parentId: string;

  @ForeignKey(() => PostModel)
  @AllowNull(false)
  @IsUUID()
  @Column
  public postId: string;

  @Length({ max: 5000 })
  @Column
  public content: string;

  @Column
  public totalReply?: number;

  @Column
  public createdBy: string;

  @Column
  public edited?: boolean;

  @Column
  public isHidden?: boolean;

  @AllowNull(true)
  @Column
  public giphyId: string;

  @Column
  public updatedBy: string;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;

  @AllowNull(true)
  @Column({
    type: DataTypes.JSONB,
  })
  public mediaJson: any;

  @AllowNull(true)
  @Column({
    type: DataTypes.JSONB,
  })
  public mentions: string[];

  @BelongsTo(() => PostModel)
  public post: PostModel;

  public parent?: CommentModel;

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
    if (comment.parentId !== NIL_UUID) {
      const parentComment = await comment.sequelize
        .model(CommentModel.name)
        .findByPk(comment.parentId);
      await parentComment[action]('totalReply');
    }
  }

  /**
   * Update Comment Count For Post
   * @param sequelize Sequelize
   * @param postId String
   * @param action ActionEnum
   * @private
   */
  private static async _updateCommentCountForPost(
    sequelize: Sequelize,
    postId: string,
    action: ActionEnum
  ): Promise<void> {
    const post = await sequelize.model(PostModel.name).findByPk(postId);
    if (post) {
      await post[action]('comments_count');
    }
  }

  private static async _getCondition(getCommentsDto: GetCommentsDto): Promise<any> {
    const { schema } = getDatabaseConfig();
    const {
      postId,
      parentId,
      idGT,
      idGTE,
      idLT,
      idLTE,
      createdAtGT,
      createdAtGTE,
      createdAtLT,
      createdAtLTE,
    } = getCommentsDto;
    let condition = ` "c".parent_id = ${this.sequelize.escape(parentId ?? NIL)}`;
    if (postId) {
      condition += ` AND "c".post_id = ${this.sequelize.escape(postId)}`;
    }

    if (idGT) {
      const id = this.sequelize.escape(idGT);
      condition += ` AND ( "c".id != ${id} AND "c".created_at >= (SELECT "c".created_at FROM ${schema}.comments AS "c" WHERE "c".id = ${id}))`;
    }
    if (idGTE) {
      const id = this.sequelize.escape(idGTE);
      condition += ` AND ( "c".created_at >= (SELECT "c".created_at FROM ${schema}.comments AS "c" WHERE "c".id = ${id}))`;
    }
    if (idLT) {
      const id = this.sequelize.escape(idLT);
      condition += ` AND ( "c".id != ${id} AND "c".created_at <= (SELECT "c".created_at FROM ${schema}.comments AS "c" WHERE "c".id = ${id}))`;
    }
    if (idLTE) {
      const id = this.sequelize.escape(idLTE);
      condition += ` AND ( "c".created_at <= (SELECT "c".created_at FROM ${schema}.comments AS "c" WHERE "c".id = ${id}))`;
    }

    if (createdAtGT) {
      const createdAt = this.sequelize.escape(createdAtGT);
      condition += ` AND "c".created_at > ${createdAt}`;
    }
    if (createdAtGTE) {
      const createdAt = this.sequelize.escape(createdAtGTE);
      condition += ` AND "c".created_at >= ${createdAt}`;
    }
    if (createdAtLT) {
      const createdAt = this.sequelize.escape(createdAtLT);
      condition += ` AND "c".created_at < ${createdAt}`;
    }
    if (createdAtLTE) {
      const createdAt = this.sequelize.escape(createdAtLTE);
      condition += ` AND "c".created_at <= ${createdAt}`;
    }
    return condition;
  }

  public static async getList(
    getCommentsDto: GetCommentsDto,
    authUserId?: string,
    aroundId = NIL_UUID
  ): Promise<any[]> {
    const { limit } = getCommentsDto;
    const order = getCommentsDto.order ?? ORDER.DESC;
    const { schema } = getDatabaseConfig();
    const reportContentDetailTable = ReportContentDetailModel.tableName;
    let condition = await CommentModel._getCondition(getCommentsDto);
    condition += `AND "c".is_hidden = false AND NOT EXISTS ( 
      SELECT target_id FROM  ${schema}.${reportContentDetailTable} rp
      WHERE rp.target_id = "c".id AND target_type = 'COMMENT' AND rp.created_by = ${this.sequelize.escape(
        authUserId
      )}
    )`;
    let select = `SELECT "CommentModel".*`;

    if (authUserId) {
      select += `,"ownerReactions"."id" AS "commentReactionId", 
      "ownerReactions"."reaction_name" AS "reactionName",
      "ownerReactions"."created_at" AS "reactCreatedAt"`;
    }

    const subSelect = `SELECT 
    "c"."id",
    "c"."parent_id" AS "parentId", 
    "c"."post_id" AS "postId",
    "c"."content", 
    "c"."mentions", 
    "c"."edited", 
    "c"."media_json" as "media",
    "c"."giphy_id" as "giphyId",
    "c"."total_reply" AS "totalReply", 
    "c"."created_by" AS "createdBy", 
    "c"."updated_by" AS "updatedBy", 
    "c"."created_at" AS "createdAt", 
    "c"."updated_at" AS "updatedAt"`;
    const query = `${select}
      FROM (
        ${subSelect}
        FROM ${schema}."comments" AS "c"
        WHERE ${condition} 
        ORDER BY "c"."created_at" ${order}
        OFFSET 0 LIMIT :limit
      ) AS "CommentModel"
      ${
        authUserId
          ? `LEFT OUTER JOIN ${schema}."comments_reactions" AS "ownerReactions" ON "CommentModel"."id" = "ownerReactions"."comment_id" AND "ownerReactions"."created_by" = :authUserId`
          : ``
      }
      ORDER BY "CommentModel"."createdAt" ${order}`;
    const rows: any[] = await this.sequelize.query(query, {
      replacements: {
        aroundId,
        authUserId,
        limit: limit + 1,
      },
      type: QueryTypes.SELECT,
    });

    return rows;
  }

  public static async getListArroundId(
    aroundId: string,
    getCommentsDto: GetCommentsDto,
    authUserId?: string
  ): Promise<any[]> {
    const { limit } = getCommentsDto;
    const order = getCommentsDto.order ?? ORDER.DESC;
    const { schema } = getDatabaseConfig();
    const condition = await CommentModel._getCondition(getCommentsDto);
    const reportContentDetailTable = ReportContentDetailModel.tableName;
    let select = `SELECT "CommentModel".*`;

    if (authUserId) {
      select += `,"ownerReactions"."id" AS "commentReactionId", 
      "ownerReactions"."reaction_name" AS "reactionName",
      "ownerReactions"."created_at" AS "reactCreatedAt"`;
    }

    const subSelect = `SELECT 
    "c"."id",
    "c"."parent_id" AS "parentId", 
    "c"."post_id" AS "postId",
    "c"."content", 
    "c"."mentions", 
    "c"."edited", 
    "c"."media_json" as "media",
    "c"."giphy_id" as "giphyId",
    "c"."total_reply" AS "totalReply", 
    "c"."created_by" AS "createdBy", 
    "c"."updated_by" AS "updatedBy", 
    "c"."created_at" AS "createdAt", 
    "c"."updated_at" AS "updatedAt"`;

    const query = `${select}
    FROM (
      (
      ${subSelect}
      FROM ${schema}."comments" AS "c"
      WHERE ${condition} AND "c".created_at <= ( SELECT "c1"."created_at" FROM ${schema}."comments" AS "c1" WHERE "c1".id = :aroundId)
      AND "c".is_hidden = false AND NOT EXISTS (
        SELECT target_id FROM  ${schema}.${reportContentDetailTable} rp
        WHERE rp.target_id = "c".id AND target_type = '${
          TargetType.COMMENT
        }' AND rp.created_by = ${this.sequelize.escape(authUserId)}
      )
      ORDER BY "c"."created_at" DESC
      OFFSET 0 LIMIT :limitTop
      )
      UNION ALL 
      (
        ${subSelect}
        FROM ${schema}."comments" AS "c"
        WHERE ${condition} AND "c".created_at > ( SELECT "c1"."created_at" FROM ${schema}."comments" AS "c1" WHERE "c1".id = :aroundId)
        AND "c".is_hidden = false AND NOT EXISTS ( 
          SELECT target_id FROM  ${schema}.${reportContentDetailTable} rp
          WHERE rp.target_id = "c".id AND target_type = '${
            TargetType.COMMENT
          }' AND rp.created_by = ${this.sequelize.escape(authUserId)}
        )
        ORDER BY "c"."created_at" ASC
        OFFSET 0 LIMIT :limitBottom
      )
    ) AS "CommentModel"
    ${
      authUserId
        ? `LEFT OUTER JOIN ${schema}."comments_reactions" AS "ownerReactions" ON "CommentModel"."id" = "ownerReactions"."comment_id" AND "ownerReactions"."created_by" = :authUserId `
        : ``
    }
    ORDER BY "CommentModel"."createdAt" ${order}`;
    const rows: any[] = await this.sequelize.query(query, {
      replacements: {
        aroundId,
        authUserId,
        limitTop: limit + 1,
        limitBottom: limit,
      },
      type: QueryTypes.SELECT,
    });

    return rows;
  }

  public static async getChildByComments(
    comments: any[],
    authUserId: string,
    limit: number
  ): Promise<any[]> {
    const subQuery = [];
    const { schema } = getDatabaseConfig();
    const reportContentDetailTable = ReportContentDetailModel.tableName;
    for (const comment of comments) {
      subQuery.push(`(SELECT * 
      FROM (
        SELECT 
              "id", 
              "parent_id" AS "parentId", 
              "post_id" AS "postId", 
              "mentions",
              "content", 
              "edited",
              "media_json" as "media",
              "total_reply" AS "totalReply", 
              "created_by" AS "createdBy", 
              "updated_by" AS "updatedBy", 
              "created_at" AS "createdAt", 
              "updated_at" AS "updatedAt",
              "giphy_id" AS "giphyId"
        FROM ${schema}."comments" AS "CommentModel"
        WHERE "CommentModel"."parent_id" = ${this.sequelize.escape(comment.id)} 
        AND "CommentModel".is_hidden = false AND NOT EXISTS ( 
          SELECT target_id FROM  ${schema}.${reportContentDetailTable} rp
          WHERE rp.target_id = "CommentModel".id AND target_type = 'COMMENT' AND rp.created_by = ${this.sequelize.escape(
            authUserId
          )}
        )
        ORDER BY "CommentModel"."created_at" DESC LIMIT :limit
      ) AS sub)`);
    }

    let query = `SELECT 
      "CommentModel".*
      ${
        authUserId
          ? `,"ownerReactions"."id" AS "commentReactionId", 
      "ownerReactions"."reaction_name" AS "reactionName",
      "ownerReactions"."created_at" AS "reactCreatedAt"`
          : ``
      }
    FROM (${subQuery.join(' UNION ALL ')}) AS "CommentModel"`;
    if (authUserId) {
      query += `LEFT OUTER JOIN ${schema}."comments_reactions" AS "ownerReactions" ON "CommentModel"."id" = "ownerReactions"."comment_id" 
      AND "ownerReactions"."created_by" = :authUserId`;
    }
    query += ` ORDER BY "CommentModel"."createdAt" DESC`;

    const rows: any[] = await this.sequelize.query(query, {
      replacements: {
        authUserId,
        limit: limit + 1,
      },
      type: QueryTypes.SELECT,
    });

    return rows;
  }
}
