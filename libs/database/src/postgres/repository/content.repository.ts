import { ORDER } from '@beincom/constants';
import {
  CursorPaginationResult,
  CursorPaginator,
  getDatabaseConfig,
  PaginationProps,
  PAGING_DEFAULT_LIMIT,
} from '@libs/database/postgres/common';
import { CategoryModel } from '@libs/database/postgres/model/category.model';
import { LinkPreviewModel } from '@libs/database/postgres/model/link-preview.model';
import {
  PostCategoryAttributes,
  PostCategoryModel,
} from '@libs/database/postgres/model/post-category.model';
import {
  PostGroupAttributes,
  PostGroupModel,
} from '@libs/database/postgres/model/post-group.model';
import { PostReactionModel } from '@libs/database/postgres/model/post-reaction.model';
import {
  PostSeriesAttributes,
  PostSeriesModel,
} from '@libs/database/postgres/model/post-series.model';
import { PostTagAttributes, PostTagModel } from '@libs/database/postgres/model/post-tag.model';
import { PostAttributes, PostModel } from '@libs/database/postgres/model/post.model';
import { QuizModel } from '@libs/database/postgres/model/quiz.model';
import { ReportContentDetailModel } from '@libs/database/postgres/model/report-content-detail.model';
import {
  UserMarkedImportantPostAttributes,
  UserMarkReadPostModel,
} from '@libs/database/postgres/model/user-mark-read-post.model';
import { UserNewsFeedModel } from '@libs/database/postgres/model/user-newsfeed.model';
import { UserSavePostModel } from '@libs/database/postgres/model/user-save-post.model';
import {
  UserSeenPostAttributes,
  UserSeenPostModel,
} from '@libs/database/postgres/model/user-seen-post.model';
import {
  FindContentProps,
  GetPaginationContentsProps,
  OrderOptions,
  ILibContentRepository,
} from '@libs/database/postgres/repository/interface';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { isBoolean } from 'lodash';
import {
  BulkCreateOptions,
  CreateOptions,
  FindOptions,
  Includeable,
  Op,
  Sequelize,
  Transaction,
  WhereOptions,
} from 'sequelize';
import { Literal } from 'sequelize/types/utils';

export class LibContentRepository implements ILibContentRepository {
  public constructor(
    @InjectConnection() private readonly _sequelizeConnection: Sequelize,
    @InjectModel(PostModel)
    private readonly _postModel: typeof PostModel,
    @InjectModel(PostGroupModel)
    private readonly _postGroupModel: typeof PostGroupModel,
    @InjectModel(PostSeriesModel)
    private readonly _postSeriesModel: typeof PostSeriesModel,
    @InjectModel(PostTagModel)
    private readonly _postTagModel: typeof PostTagModel,
    @InjectModel(PostCategoryModel)
    private readonly _postCategoryModel: typeof PostCategoryModel,
    @InjectModel(UserSeenPostModel)
    private readonly _userSeenPostModel: typeof UserSeenPostModel,
    @InjectModel(UserMarkReadPostModel)
    private readonly _userReadImportantPostModel: typeof UserMarkReadPostModel
  ) {}

  public async bulkCreatePostGroup(
    postGroups: PostGroupAttributes[],
    options?: BulkCreateOptions
  ): Promise<void> {
    await this._postGroupModel.bulkCreate(postGroups, options);
  }

  public async deletePostGroup(
    where: WhereOptions<PostGroupAttributes>,
    transaction?: Transaction
  ): Promise<void> {
    await this._postGroupModel.destroy({
      where,
      transaction,
    });
  }

  public async bulkCreatePostSeries(
    postGroups: PostSeriesAttributes[],
    options?: BulkCreateOptions
  ): Promise<void> {
    await this._postSeriesModel.bulkCreate(postGroups, options);
  }

  public async deletePostSeries(
    where: WhereOptions<PostSeriesAttributes>,
    transaction?: Transaction
  ): Promise<void> {
    await this._postSeriesModel.destroy({
      where,
      transaction,
    });
  }

  public async bulkCreatePostTag(
    postGroups: PostTagAttributes[],
    options?: BulkCreateOptions
  ): Promise<void> {
    await this._postTagModel.bulkCreate(postGroups, options);
  }

  public async deletePostTag(
    where: WhereOptions<PostTagAttributes>,
    transaction?: Transaction
  ): Promise<void> {
    await this._postTagModel.destroy({
      where,
      transaction,
    });
  }

  public async bulkCreatePostCategory(
    postGroups: PostCategoryAttributes[],
    options?: BulkCreateOptions
  ): Promise<void> {
    await this._postCategoryModel.bulkCreate(postGroups, options);
  }

  public async deletePostCategory(
    where: WhereOptions<PostCategoryAttributes>,
    transaction?: Transaction
  ): Promise<void> {
    await this._postCategoryModel.destroy({
      where,
      transaction,
    });
  }

  public async bulkCreateSeenPost(
    seenPosts: UserSeenPostAttributes[],
    options?: BulkCreateOptions
  ): Promise<void> {
    await this._userSeenPostModel.bulkCreate(seenPosts, options);
  }

  public async bulkCreateReadImportantPost(
    readImportantPosts: UserMarkedImportantPostAttributes[],
    options?: BulkCreateOptions
  ): Promise<void> {
    await this._userReadImportantPostModel.bulkCreate(readImportantPosts, options);
  }

  public async create(data: PostAttributes, options?: CreateOptions): Promise<void> {
    await this._postModel.create(data, options);
  }

  public async update(
    contentId: string,
    data: Partial<PostAttributes>,
    transaction?: Transaction
  ): Promise<void> {
    await this._postModel.update(data, {
      where: {
        id: contentId,
      },
      transaction,
    });
  }

  public async delete(id: string): Promise<void> {
    await this._postModel.destroy({ where: { id } });
  }

  public async findOne(findOnePostOptions: FindContentProps): Promise<PostModel> {
    const findOption = this.buildFindOptions(findOnePostOptions);
    return this._postModel.findOne(findOption);
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
    return this._postModel.findAll(findOption);
  }

  public async getPagination(
    getPaginationContentsProps: GetPaginationContentsProps
  ): Promise<CursorPaginationResult<PostModel>> {
    const { after, before, limit = PAGING_DEFAULT_LIMIT, order } = getPaginationContentsProps;
    const findOption = this.buildFindOptions(getPaginationContentsProps);
    const orderBuilder = this.buildOrderByOptions(getPaginationContentsProps.orderOptions);

    const cursorColumns = orderBuilder?.map((order) => order[0]);

    const paginator = new CursorPaginator(
      this._postModel,
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

  protected buildFindOptions(options: FindContentProps): FindOptions<PostAttributes> {
    const findOptions: FindOptions<PostAttributes> = {};
    const subSelect = this._buildSubSelect(options);

    findOptions.where = this._buildWhereOptions(options);
    findOptions.include = this._buildRelationOptions(options);

    const { exclude = [] } = options.attributes || {};
    findOptions.attributes = {
      ...(subSelect.length && {
        include: [...subSelect],
      }),
      ...(exclude.length && {
        exclude,
      }),
    };

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
    if (orderOptions.sortColumn && orderOptions.sortBy) {
      order.push([orderOptions.sortColumn, orderOptions.sortBy]);
    }
    order.push(['createdAt', ORDER.DESC]);
    return order;
  }

  private _buildSubSelect(options: FindContentProps): [Literal, string][] {
    if (!options?.include) {
      return [];
    }

    const subSelect: [Literal, string][] = [];
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

  private _buildRelationOptions(options: FindContentProps): Includeable[] {
    if (!options?.include) {
      return [];
    }

    const includeable = [];
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
        attributes: ['seriesId'],
        where: isBoolean(groupArchived)
          ? this._postSeriesFilterInGroupArchivedCondition(groupArchived)
          : undefined,
      });
    }

    if (shouldIncludeItems) {
      includeable.push({
        model: PostSeriesModel,
        as: 'itemIds',
        required: false,
        attributes: ['postId', 'zindex'],
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
        attributes: [
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
        attributes: ['id', 'name'],
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
        conditions.push(this._excludeReportedByUser(options.where.excludeReportedByUserId));
      }

      if (options.where.savedByUserId) {
        conditions.push(this._filterSavedByUser(options.where.savedByUserId));
      }

      if (options.where.inNewsfeedUserId) {
        conditions.push(this._filterInNewsfeedUser(options.where.inNewsfeedUserId));
      }

      if (
        isBoolean(options.where.groupArchived) &&
        !options.include?.shouldIncludeGroup &&
        !options.include?.mustIncludeGroup
      ) {
        conditions.push(this._postFilterInGroupArchivedCondition(options.where.groupArchived));
      }

      if (conditions.length) {
        whereOptions = {
          [Op.and]: conditions,
        };
      }
    }

    return whereOptions;
  }

  private _loadSaved(authUserId: string, alias?: string): [Literal, string] {
    const { schema } = getDatabaseConfig();
    const userSavePostTable = UserSavePostModel.tableName;
    if (!authUserId) {
      return [Sequelize.literal(`(false)`), alias ? alias : 'isSaved'];
    }
    return [
      Sequelize.literal(`(
        COALESCE((SELECT true FROM ${schema}.${userSavePostTable} as r
          WHERE r.post_id = "PostModel".id AND r.user_id = ${this._postModel.sequelize.escape(
            authUserId
          )}), false)
               )`),
      alias ? alias : 'isSaved',
    ];
  }

  private _loadMarkReadPost(authUserId: string, alias?: string): [Literal, string] {
    const { schema } = getDatabaseConfig();
    const userMarkReadPostTable = UserMarkReadPostModel.tableName;
    if (!authUserId) {
      return [Sequelize.literal(`(false)`), alias ? alias : 'markedReadPost'];
    }
    return [
      Sequelize.literal(`(
        COALESCE((SELECT true FROM ${schema}.${userMarkReadPostTable} as r
          WHERE r.post_id = "PostModel".id AND r.user_id = ${this._postModel.sequelize.escape(
            authUserId
          )}), false)
               )`),
      alias ? alias : 'markedReadPost',
    ];
  }

  private _loadImportant(authUserId: string, alias?: string): [Literal, string] {
    const { schema } = getDatabaseConfig();
    const userMarkReadPostTable = UserMarkReadPostModel.tableName;
    if (!authUserId) {
      return [Sequelize.literal(`"PostModel".is_important`), alias ? alias : 'isImportant'];
    }
    return [
      Sequelize.literal(`(
        CASE WHEN is_important = TRUE AND COALESCE((SELECT TRUE FROM ${schema}.${userMarkReadPostTable} as r
          WHERE r.post_id = "PostModel".id AND r.user_id = ${this._postModel.sequelize.escape(
            authUserId
          )}), FALSE) = FALSE THEN 1 ELSE 0 END
               )`),
      alias ? alias : 'isImportant',
    ];
  }

  private _excludeReportedByUser(userId: string): Literal {
    const { schema } = getDatabaseConfig();
    const reportContentDetailTable = ReportContentDetailModel.tableName;
    return Sequelize.literal(
      `NOT EXISTS ( 
        SELECT target_id FROM ${schema}.${reportContentDetailTable} rp
          WHERE rp.target_id = "PostModel".id AND rp.created_by = ${this._postModel.sequelize.escape(
            userId
          )}
      )`
    );
  }

  private _filterSavedByUser(userId: string): Literal {
    const { schema } = getDatabaseConfig();
    const userSavePostTable = UserSavePostModel.tableName;
    return Sequelize.literal(
      `EXISTS ( 
          SELECT sp.user_id FROM ${schema}.${userSavePostTable} sp
            WHERE sp.post_id = "PostModel".id AND sp.user_id = ${this._postModel.sequelize.escape(
              userId
            )}
        )`
    );
  }

  private _filterInNewsfeedUser(userId: string): Literal {
    const { schema } = getDatabaseConfig();
    const userNewsFeedTable = UserNewsFeedModel.tableName;
    return Sequelize.literal(
      `EXISTS ( 
          SELECT nf.user_id FROM  ${schema}.${userNewsFeedTable} nf
            WHERE nf.post_id = "PostModel".id AND nf.user_id = ${this._postModel.sequelize.escape(
              userId
            )}
        )`
    );
  }

  private _postFilterInGroupArchivedCondition(groupArchived: boolean): Literal {
    const { schema } = getDatabaseConfig();
    const postGroupTable = PostGroupModel.tableName;
    return Sequelize.literal(
      `EXISTS (
          SELECT g.group_id FROM  ${schema}.${postGroupTable} g
            WHERE g.post_id = "PostModel".id  AND g.is_archived = ${groupArchived}
        )`
    );
  }

  private _postSeriesFilterInGroupArchivedCondition(groupArchived: boolean): Literal {
    const { schema } = getDatabaseConfig();
    const postGroupTable = PostGroupModel.tableName;
    return Sequelize.literal(
      `EXISTS (
        SELECT seriesGroups.post_id FROM ${schema}.${postGroupTable} as seriesGroups
          WHERE seriesGroups.post_id = "postSeries".series_id AND seriesGroups.is_archived = ${groupArchived}
        )`
    );
  }
}
