import { Injectable } from '@nestjs/common';
import { PageDto } from '../../common/dto';
import { ArticleService } from '../article/article.service';
import { ArticleResponseDto } from '../article/dto/responses';
import { GetsByAdminDto } from './dto/requests/gets-by-admin.dto';
import { PostGroupModel } from '../../database/models/post-group.model';
import { MentionModel } from '../../database/models/mention.model';
import { MediaModel } from '../../database/models/media.model';
import { CategoryModel } from '../../database/models/category.model';
import { GetArticleDto } from '../article/dto/requests';
import { PostModel, PostStatus } from '../../database/models/post.model';
import { Op } from 'sequelize';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { LinkPreviewModel } from '../../database/models/link-preview.model';
import { PostHelper } from '../post/post.helper';
import { ClassTransformer } from 'class-transformer';
import { ArticleBindingService } from '../article/article-binding.service';
import { UserDto } from '../v2-user/application';

@Injectable()
export class AdminService {
  public constructor(
    private _articleService: ArticleService,
    private _articleBinding: ArticleBindingService
  ) {}
  private readonly _classTransformer = new ClassTransformer();
  public async getPostsByParamsInGroups(
    getsByAdminDto: GetsByAdminDto,
    authUser: UserDto
  ): Promise<PageDto<ArticleResponseDto>> {
    const { limit, offset, order, status, groupIds } = getsByAdminDto;
    const condition = {};
    if (status) {
      condition['status'] = status;
    }
    const postsSorted = await this._articleService.getPostsByFilter(
      {
        groupIds,
        status,
      },
      {
        sortColumn: PostHelper.scheduleTypeStatus.some((e) => condition['status'].includes(e))
          ? 'publishedAt'
          : 'createdAt',
        sortBy: order,
        limit: limit + 1,
        offset,
      }
    );

    let hasNextPage = false;
    if (postsSorted.length > limit) {
      postsSorted.pop();
      hasNextPage = true;
    }

    const postsInfo = await this._articleService.getPostsByIds(
      postsSorted.map((post) => post.id),
      authUser.id
    );

    const postsBindedData = await this._articleBinding.bindRelatedData(postsInfo, {
      shouldBindReaction: true,
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: true,
      authUser,
    });

    const result = this._classTransformer.plainToInstance(ArticleResponseDto, postsBindedData, {
      excludeExtraneousValues: true,
    });

    return new PageDto<ArticleResponseDto>(result, {
      limit,
      offset,
      hasNextPage,
    });
  }

  public async getPostDetail(
    articleId: string,
    getArticleDto: GetArticleDto
  ): Promise<ArticleResponseDto> {
    const attributes = {
      exclude: ['updatedBy'],
    };
    attributes['include'] = [
      ['hashtags_json', 'hashtags'],
      ['tags_json', 'tags'],
    ];
    const include = [
      {
        model: PostGroupModel,
        as: 'groups',
        required: false,
        attributes: ['groupId', 'isArchived'],
        where: {
          isArchived: false,
        },
      },
      {
        model: MentionModel,
        as: 'mentions',
        required: false,
      },
      {
        model: MediaModel,
        as: 'media',
        required: false,
        attributes: [
          'id',
          'url',
          'size',
          'extension',
          'type',
          'name',
          'originName',
          'width',
          'height',
          'thumbnails',
          'status',
          'mimeType',
          'createdAt',
        ],
      },
      {
        model: PostReactionModel,
        as: 'ownerReactions',
        required: false,
      },
      {
        model: CategoryModel,
        as: 'categories',
        required: false,
        through: {
          attributes: [],
        },
        attributes: ['id', 'name'],
      },
      {
        model: LinkPreviewModel,
        as: 'linkPreview',
        required: false,
      },
      {
        model: MediaModel,
        as: 'coverMedia',
        required: false,
      },
      {
        model: PostModel,
        as: 'series',
        required: false,
        through: {
          attributes: [],
        },
        attributes: ['id', 'title'],
      },
    ];

    const condition = { id: articleId, status: { [Op.not]: PostStatus.DRAFT } };
    return this._articleService.getDetail(
      attributes,
      condition,
      include,
      articleId,
      null,
      getArticleDto,
      false
    );
  }
}
