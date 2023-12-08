import { ORDER } from '@beincom/constants';
import { FindOptions, Include } from '@libs/database/postgres';
import {
  CursorPaginationProps,
  CursorPaginationResult,
  PaginationProps,
  PAGING_DEFAULT_LIMIT,
} from '@libs/database/postgres/common';
import { getDatabaseConfig } from '@libs/database/postgres/config';
import {
  PostCategoryModel,
  ReportDetailModel,
  ReportModel,
  UserSeenPostModel,
} from '@libs/database/postgres/model';
import { CategoryModel } from '@libs/database/postgres/model/category.model';
import { LinkPreviewModel } from '@libs/database/postgres/model/link-preview.model';
import { PostGroupModel } from '@libs/database/postgres/model/post-group.model';
import { PostReactionModel } from '@libs/database/postgres/model/post-reaction.model';
import { PostSeriesModel } from '@libs/database/postgres/model/post-series.model';
import { PostAttributes, PostModel } from '@libs/database/postgres/model/post.model';
import { QuizModel } from '@libs/database/postgres/model/quiz.model';
import { UserMarkReadPostModel } from '@libs/database/postgres/model/user-mark-read-post.model';
import { UserNewsFeedModel } from '@libs/database/postgres/model/user-newsfeed.model';
import { UserSavePostModel } from '@libs/database/postgres/model/user-save-post.model';
import { BaseRepository } from '@libs/database/postgres/repository/base.repository';
import {
  FindContentProps,
  OrderOptions,
} from '@libs/database/postgres/repository/interface/content.repository.interface';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { isBoolean } from 'lodash';
import { Op, Sequelize, WhereOptions } from 'sequelize';

export class LibContentRepository extends BaseRepository<PostModel> {
  public constructor(
    @InjectModel(ReportModel)
    private readonly _reportModel: typeof ReportModel,
    @InjectConnection() private readonly _sequelizeConnection: Sequelize
  ) {
    super(PostModel);
  }

  public async findOne(findOnePostOptions: FindContentProps): Promise<PostModel> {
    const findOption = this.buildFindOptions(findOnePostOptions);
    return this.first(findOption);
  }

  public async findAll(
    findAllPostOptions: FindContentProps,
    offsetPaginate?: PaginationProps
  ): Promise<PostModel[]> {
    const findOption = this.buildFindOptions(findAllPostOptions);
    findOption.order = this.buildOrderByOptions(findAllPostOptions.orderOptions);
    findOption.subQuery = false;
    if (offsetPaginate) {
      findOption.limit = offsetPaginate.limit;
      findOption.offset = offsetPaginate.offset;
    }
    return this.findMany(findOption);
  }

  public async getPagination(
    getPaginationContentsProps: FindContentProps & CursorPaginationProps
  ): Promise<CursorPaginationResult<PostModel>> {
    const {
      after,
      before,
      limit = PAGING_DEFAULT_LIMIT,
      order = ORDER.DESC,
    } = getPaginationContentsProps;
    const findOption = this.buildFindOptions(getPaginationContentsProps);
    const orderBuilder = this.buildOrderByOptions(getPaginationContentsProps.orderOptions);

    const cursorColumns = orderBuilder?.map((order) => order[0]);
    const { rows, meta } = await this.cursorPaginate(findOption, {
      limit,
      before,
      after,
      order,
      sortColumns: cursorColumns || ['createdAt'],
    });

    return {
      rows,
      meta,
    };
  }

  protected buildFindOptions(options: FindContentProps): FindOptions<PostModel> {
    const findOptions: FindOptions<PostModel> = {};
    findOptions.subQuery = true;

    const subSelect = this._buildSubSelect(options);

    findOptions.where = this._buildWhereOptions(options);
    findOptions.include = this._buildRelationOptions(options);

    const { exclude = [] } = options.attributes || {};
    findOptions.select = options.select || [
      'id',
      'commentsCount',
      'totalUsersSeen',
      'wordCount',
      'isImportant',
      'importantExpiredAt',
      'canComment',
      'canReact',
      'isHidden',
      'isReported',
      'content',
      'title',
      'mentions',
      'type',
      'summary',
      'lang',
      'privacy',
      'tagsJson',
      'createdBy',
      'updatedBy',
      'linkPreviewId',
      'videoIdProcessing',
      'cover',
      'status',
      'publishedAt',
      'scheduledAt',
      'errorLog',
      'coverJson',
      'mediaJson',
      'createdAt',
      'updatedAt',
    ];
    if (subSelect) {
      findOptions.selectRaw = [...subSelect];
    }
    if (exclude) {
      findOptions.selectExclude = [...exclude];
    }
    return findOptions;
  }

  protected buildOrderByOptions(orderOptions: OrderOptions): any {
    if (!orderOptions) {
      return undefined;
    }
    const order = [];
    if (orderOptions.isImportantFirst) {
      order.push([this._sequelizeConnection.literal('"isReadImportant"'), ORDER.DESC]);
    }
    if (orderOptions.isPublishedByDesc) {
      order.push(['publishedAt', ORDER.DESC]);
    }
    if (orderOptions.sortColumn && orderOptions.orderBy) {
      order.push([orderOptions.sortColumn, orderOptions.orderBy]);
    }
    if (orderOptions.isSavedDateByDesc) {
      order.push([
        { model: UserSavePostModel, as: 'userSavePosts', field: 'createdAt' },
        ORDER.DESC,
      ]);
    }
    if (orderOptions.createdAtDesc) {
      order.push(['createdAt', ORDER.DESC]);
    }
    return order;
  }

  private _buildSubSelect(options: FindContentProps): [string, string][] {
    if (!options?.include) {
      return [];
    }

    const subSelect: [string, string][] = [];
    const {
      shouldIncludeSaved,
      shouldIncludeMarkReadImportant,
      shouldIncludeImportant,
      shouldIncludeCategory,
      shouldIncludeQuiz,
      shouldIncludeItems,
      shouldIncludeReaction,
      shouldIncludeSeries,
      shouldIncludeSeen,
    } = options.include || {};

    if (shouldIncludeSeen) {
      subSelect.push(this._loadSeen(shouldIncludeSeen.userId, 'isSeen'));
    }
    if (shouldIncludeSaved) {
      subSelect.push(this._loadSaved(shouldIncludeSaved.userId, 'isSaved'));
    }

    if (shouldIncludeMarkReadImportant) {
      subSelect.push(
        this._loadMarkReadPost(shouldIncludeMarkReadImportant.userId, 'markedReadPost')
      );
    }

    if (shouldIncludeImportant) {
      subSelect.push(this._loadImportant(shouldIncludeImportant.userId, 'isReadImportant'));
    }

    if (shouldIncludeItems) {
      subSelect.push(this._loadItemsInSeriesAndSort());
    }
    if (shouldIncludeReaction) {
      subSelect.push(this._loadOwnerReaction(shouldIncludeReaction.userId));
    }

    if (shouldIncludeCategory) {
      subSelect.push(this._loadCategories());
    }

    if (shouldIncludeQuiz) {
      subSelect.push(this._loadQuiz());
    }

    if (shouldIncludeSeries) {
      subSelect.push(this._loadSeriesIds(options.where?.groupArchived));
    }

    return subSelect;
  }

  private _buildRelationOptions(options: FindContentProps): Include<PostModel>[] {
    if (!options?.include) {
      return [];
    }

    const includeable: Include<PostModel>[] = [];
    const { groupArchived, groupIds } = options.where || {};
    const {
      shouldIncludeLinkPreview,
      shouldIncludeSaved,
      shouldIncludeGroup,
      mustIncludeGroup,
      mustIncludeSaved,
    } = options.include;

    if (shouldIncludeGroup || mustIncludeGroup) {
      includeable.push({
        model: PostGroupModel,
        as: 'groups',
        required: Boolean(mustIncludeGroup),
        where: {
          ...(isBoolean(groupArchived) && {
            isArchived: groupArchived,
          }),
          ...(groupIds && {
            groupId: groupIds,
          }),
        },
      });
    }

    if (shouldIncludeLinkPreview) {
      includeable.push({
        model: LinkPreviewModel,
        as: 'linkPreview',
        required: false,
      });
    }

    if (shouldIncludeSaved || mustIncludeSaved) {
      includeable.push({
        model: UserSavePostModel,
        as: 'userSavePosts',
        required: Boolean(mustIncludeSaved),
        where: {
          userId: shouldIncludeSaved?.userId || mustIncludeSaved?.userId,
        },
      });
    }

    return includeable;
  }

  private _buildWhereOptions(options: FindContentProps): WhereOptions<PostAttributes> {
    let whereOptions: WhereOptions<PostAttributes> | undefined;

    if (options?.where) {
      const conditions = [];
      if (options.where.id) {
        conditions.push({
          id: options.where.id,
        });
      }

      if (options.where.ids) {
        conditions.push({
          id: options.where.ids,
        });
      }

      if (options.where.type) {
        conditions.push({
          type: options.where.type,
        });
      }

      if (isBoolean(options.where.isImportant)) {
        conditions.push({
          isImportant: options.where.isImportant,
        });
      }

      if (options.where.status) {
        conditions.push({
          status: options.where.status,
        });
      }

      if (options.where.statuses) {
        conditions.push({
          status: options.where.statuses,
        });
      }

      if (options.where.createdBy) {
        conditions.push({
          createdBy: options.where.createdBy,
        });
      }

      if (isBoolean(options.where.isHidden)) {
        conditions.push({
          isHidden: options.where.isHidden,
        });
      }

      if (options.where.scheduledAt) {
        conditions.push({
          scheduledAt: { [Op.lte]: options.where.scheduledAt },
        });
      }

      if (options.where.excludeReportedByUserId) {
        conditions.push(
          Sequelize.literal(this._excludeReportedByUser(options.where.excludeReportedByUserId))
        );
      }

      if (options.where.savedByUserId) {
        conditions.push(Sequelize.literal(this._filterSavedByUser(options.where.savedByUserId)));
      }

      if (options.where.inNewsfeedUserId) {
        conditions.push(
          Sequelize.literal(this._filterInNewsfeedUser(options.where.inNewsfeedUserId))
        );
      }

      if (options.where.videoIdProcessing) {
        conditions.push({
          videoIdProcessing: options.where.videoIdProcessing,
        });
      }

      if (
        isBoolean(options.where.groupArchived) &&
        !options.include?.shouldIncludeGroup &&
        !options.include?.mustIncludeGroup
      ) {
        conditions.push(
          Sequelize.literal(this._postFilterInGroupArchivedCondition(options.where.groupArchived))
        );
      }
      if (conditions.length) {
        whereOptions = {
          [Op.and]: conditions,
        };
      }
    }

    return whereOptions;
  }

  private _loadSaved(authUserId: string, alias?: string): [string, string] {
    const { schema } = getDatabaseConfig();
    const userSavePostTable = UserSavePostModel.tableName;
    if (!authUserId) {
      return [`(false)`, alias ? alias : 'isSaved'];
    }
    return [
      `(
        COALESCE((SELECT true FROM ${schema}.${userSavePostTable} as r
          WHERE r.post_id = "PostModel".id AND r.user_id = ${this._sequelizeConnection.escape(
            authUserId
          )}), false)
               )`,
      alias ? alias : 'isSaved',
    ];
  }

  private _loadSeen(authUserId: string, alias?: string): [string, string] {
    const userSeenPostTable = UserSeenPostModel.getTableName();
    if (!authUserId) {
      return [`(false)`, alias ? alias : 'isSeen'];
    }
    return [
      `(
        COALESCE((SELECT true FROM ${userSeenPostTable} as s
          WHERE s.post_id = "PostModel".id AND s.user_id = ${this._sequelizeConnection.escape(
            authUserId
          )}), false)
               )`,
      alias ? alias : 'isSeen',
    ];
  }

  private _loadMarkReadPost(authUserId: string, alias?: string): [string, string] {
    const { schema } = getDatabaseConfig();
    const userMarkReadPostTable = UserMarkReadPostModel.tableName;
    if (!authUserId) {
      return [`(false)`, alias ? alias : 'markedReadPost'];
    }
    return [
      `(
        COALESCE((SELECT true FROM ${schema}.${userMarkReadPostTable} as r
          WHERE r.post_id = "PostModel".id AND r.user_id = ${this._sequelizeConnection.escape(
            authUserId
          )}), false)
               )`,
      alias ? alias : 'markedReadPost',
    ];
  }

  private _loadImportant(authUserId: string, alias?: string): [string, string] {
    const { schema } = getDatabaseConfig();
    const userMarkReadPostTable = UserMarkReadPostModel.tableName;
    if (!authUserId) {
      return [`"PostModel".is_important`, alias ? alias : 'isImportant'];
    }
    return [
      `(
        CASE WHEN is_important = TRUE AND COALESCE((SELECT TRUE FROM ${schema}.${userMarkReadPostTable} as r
          WHERE r.post_id = "PostModel".id AND r.user_id = ${this._sequelizeConnection.escape(
            authUserId
          )}), FALSE) = FALSE THEN 1 ELSE 0 END
               )`,
      alias ? alias : 'isImportant',
    ];
  }

  private _loadItemsInSeriesAndSort(alias?: string): [string, string] {
    const { schema } = getDatabaseConfig();
    const postSeriesModel = PostSeriesModel.tableName;
    return [
      `(
        SELECT array_agg("postSeries".post_id order by zindex asc)
        FROM ${schema}.${postSeriesModel} as "postSeries"
        WHERE "PostModel"."id" = "postSeries"."series_id"
        )`,
      alias ? alias : 'itemIds',
    ];
  }

  private _loadQuiz(alias?: string): [string, string] {
    const { schema } = getDatabaseConfig();
    const quizModel = QuizModel.tableName;
    return [
      `(
       SELECT json_agg(
        json_build_object(
          'id',quiz.id,
          'title', quiz.title,
          'description', quiz.description,
          'status', quiz.status,
          'genStatus', quiz.gen_status,
          'createdBy', quiz.created_by,
          'createdAt', quiz.created_at,
          'updatedAt', quiz.updated_at
        ))
        from ${schema}.${quizModel} AS "quiz"
        where quiz.post_id = "PostModel".id
        )`,
      alias ? alias : 'quiz',
    ];
  }
  private _loadSeriesIds(isArchived?: boolean, alias?: string): [string, string] {
    const { schema } = getDatabaseConfig();
    const postSeriesModel = PostSeriesModel.tableName;
    const postGroupTable = PostGroupModel.tableName;

    let conditionArchiveGroup = '';
    if (isBoolean(isArchived)) {
      conditionArchiveGroup = `AND EXISTS (
        SELECT 1 FROM ${schema}.${postGroupTable} as "seriesGroups"
          WHERE "seriesGroups".post_id = "postSeries".series_id AND "seriesGroups".is_archived = ${isArchived}
        )`;
    }
    return [
      `(
       SELECT array_agg(series_id)
        FROM ${schema}.${postSeriesModel} AS "postSeries"
        WHERE "postSeries".post_id = "PostModel".id
        ${conditionArchiveGroup}
        )`,
      alias ? alias : 'seriesIds',
    ];
  }

  private _loadCategories(alias?: string): [string, string] {
    const { schema } = getDatabaseConfig();
    const categoryModel = CategoryModel.tableName;
    const postCategoryModel = PostCategoryModel.tableName;
    return [
      `(
       SELECT json_agg(
                    json_build_object(
                      'id',category.id,
                      'name', category.name
                    )
                )
        FROM ${schema}.${categoryModel} AS "category"
        INNER JOIN ${schema}.${postCategoryModel} as pc ON pc.category_id = category.id
        WHERE pc.post_id = "PostModel".id
        )`,
      alias ? alias : 'categories',
    ];
  }

  private _loadOwnerReaction(userId: string, alias?: string): [string, string] {
    const { schema } = getDatabaseConfig();
    const postReactionModel = PostReactionModel.tableName;
    if (!userId) {
      return [``, alias ? alias : 'ownerReactions'];
    }
    return [
      `(
        SELECT json_agg(
                          json_build_object(
                            'id',id,
                            'reactionName', reaction_name
                          ) order by created_at asc
                )
           FROM ${schema}.${postReactionModel} AS "ownerReactions"
           WHERE "PostModel"."id" = "ownerReactions"."post_id" AND
            "ownerReactions"."created_by" = ${this._sequelizeConnection.escape(userId)}
        )`,
      alias ? alias : 'ownerReactions',
    ];
  }

  private _excludeReportedByUser(userId: string): string {
    const { schema } = getDatabaseConfig();
    const reporterId = this._sequelizeConnection.escape(userId);

    return `NOT EXISTS ( 
              SELECT target_id FROM ${ReportDetailModel.getTableName()} rcd
              WHERE rcd.target_id = "PostModel".id AND rcd.reporter_id = ${reporterId}
            )`;
  }

  private _filterSavedByUser(userId: string): string {
    const { schema } = getDatabaseConfig();
    const userSavePostTable = UserSavePostModel.tableName;
    return `EXISTS ( 
          SELECT sp.user_id FROM ${schema}.${userSavePostTable} sp
            WHERE sp.post_id = "PostModel".id AND sp.user_id = ${this._sequelizeConnection.escape(
              userId
            )}
        )`;
  }
  //t1: 2
  //t2: 2, 4,5
  private _filterInNewsfeedUser(userId: string): string {
    const { schema } = getDatabaseConfig();
    const userNewsFeedTable = UserNewsFeedModel.tableName;
    return `EXISTS ( 
          SELECT nf.user_id FROM  ${schema}.${userNewsFeedTable} nf
            WHERE nf.post_id = "PostModel".id AND nf.user_id = ${this._sequelizeConnection.escape(
              userId
            )}
        )`;
  }

  private _postFilterInGroupArchivedCondition(groupArchived: boolean): string {
    const { schema } = getDatabaseConfig();
    const postGroupTable = PostGroupModel.tableName;
    return `EXISTS (
          SELECT g.group_id FROM  ${schema}.${postGroupTable} g
            WHERE g.post_id = "PostModel".id  AND g.is_archived = ${groupArchived}
        )`;
  }

  private _postSeriesFilterInGroupArchivedCondition(groupArchived: boolean): string {
    const { schema } = getDatabaseConfig();
    const postGroupTable = PostGroupModel.tableName;
    return `EXISTS (
        SELECT seriesGroups.post_id FROM ${schema}.${postGroupTable} as seriesGroups
          WHERE seriesGroups.post_id = "postSeries".series_id AND seriesGroups.is_archived = ${groupArchived}
        )`;
  }

  public async destroyContent(id: string): Promise<void> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      await this._reportModel.destroy({
        where: { targetId: id },
        transaction,
      });

      await this.model.destroy({
        where: { id },
        force: true,
        transaction: transaction,
      });

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }
}
