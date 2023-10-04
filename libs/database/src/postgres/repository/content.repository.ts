import { ORDER } from '@beincom/constants';
import { FindOptions, Include } from '@libs/database/postgres';
import {
  CursorPaginationProps,
  CursorPaginationResult,
  CursorPaginator,
  getDatabaseConfig,
  PaginationProps,
  PAGING_DEFAULT_LIMIT,
} from '@libs/database/postgres/common';
import {
  CategoryModel,
  LinkPreviewModel,
  PostGroupModel,
  PostReactionModel,
  PostSeriesModel,
  PostAttributes,
  PostModel,
  QuizModel,
  ReportContentDetailModel,
  UserMarkReadPostModel,
  UserNewsFeedModel,
  UserSavePostModel,
} from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';
import { FindContentProps, OrderOptions } from '@libs/database/postgres/repository/interface';
import { InjectConnection } from '@nestjs/sequelize';
import { isBoolean } from 'lodash';
import { Op, Sequelize, WhereOptions } from 'sequelize';

export class LibContentRepository extends BaseRepository<PostModel> {
  public constructor(@InjectConnection() private readonly _sequelizeConnection: Sequelize) {
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
    if (offsetPaginate) {
      findOption.limit = offsetPaginate.limit;
      findOption.offset = offsetPaginate.offset;
    }
    return this.findMany(findOption);
  }

  public async getPagination(
    getPaginationContentsProps: FindContentProps & CursorPaginationProps
  ): Promise<CursorPaginationResult<PostModel>> {
    const { after, before, limit = PAGING_DEFAULT_LIMIT, order } = getPaginationContentsProps;
    const findOption = this.buildFindOptions(getPaginationContentsProps);
    const orderBuilder = this.buildOrderByOptions(getPaginationContentsProps.orderOptions);

    const cursorColumns = orderBuilder?.map((order) => order[0]);

    const paginator = new CursorPaginator(
      this.model,
      cursorColumns || ['createdAt'],
      { before, after, limit },
      order
    );
    const { rows, meta } = await paginator.paginate(findOption);

    return {
      rows,
      meta,
    };
  }

  protected buildFindOptions(options: FindContentProps): FindOptions<PostModel> {
    const findOptions: FindOptions<PostModel> = {};
    const subSelect = this._buildSubSelect(options);

    findOptions.where = this._buildWhereOptions(options);
    findOptions.include = this._buildRelationOptions(options);

    const { exclude = [] } = options.attributes || {};
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
    order.push(['createdAt', ORDER.DESC]);
    return order;
  }

  private _buildSubSelect(options: FindContentProps): [string, string][] {
    if (!options?.include) {
      return [];
    }

    const subSelect: [string, string][] = [];
    const { shouldIncludeSaved, shouldIncludeMarkReadImportant, shouldIncludeImportant } =
      options.include || {};

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

    return subSelect;
  }

  private _buildRelationOptions(options: FindContentProps): Include<PostModel>[] {
    if (!options?.include) {
      return [];
    }

    const includeable: Include<PostModel>[] = [];
    const { groupArchived, groupIds } = options.where || {};
    const {
      shouldIncludeSeries,
      shouldIncludeGroup,
      shouldIncludeLinkPreview,
      shouldIncludeCategory,
      shouldIncludeQuiz,
      shouldIncludeReaction,
      shouldIncludeItems,
      mustIncludeGroup,
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

    if (shouldIncludeSeries) {
      includeable.push({
        model: PostSeriesModel,
        as: 'postSeries',
        required: false,
        select: ['seriesId'],
        whereRaw: isBoolean(groupArchived)
          ? this._postSeriesFilterInGroupArchivedCondition(groupArchived)
          : undefined,
      });
    }

    if (shouldIncludeItems) {
      includeable.push({
        model: PostSeriesModel,
        as: 'itemIds',
        required: false,
        select: ['postId', 'zindex'],
      });
    }

    if (shouldIncludeLinkPreview) {
      includeable.push({
        model: LinkPreviewModel,
        as: 'linkPreview',
        required: false,
      });
    }

    if (shouldIncludeReaction?.userId) {
      includeable.push({
        model: PostReactionModel,
        as: 'ownerReactions',
        required: false,
        where: {
          createdBy: shouldIncludeReaction.userId,
        },
      });
    }

    if (shouldIncludeQuiz) {
      includeable.push({
        model: QuizModel,
        as: 'quiz',
        required: false,
        select: [
          'id',
          'title',
          'description',
          'status',
          'genStatus',
          'createdBy',
          'createdAt',
          'updatedAt',
        ],
      });
    }

    if (shouldIncludeCategory) {
      includeable.push({
        model: CategoryModel,
        as: 'categories',
        required: false,
        select: ['id', 'name'],
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

  private _excludeReportedByUser(userId: string): string {
    const { schema } = getDatabaseConfig();
    const reportContentDetailTable = ReportContentDetailModel.tableName;
    return `NOT EXISTS ( 
        SELECT target_id FROM ${schema}.${reportContentDetailTable} rp
          WHERE rp.target_id = "PostModel".id AND rp.created_by = ${this._sequelizeConnection.escape(
            userId
          )}
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
}
