import { Injectable } from '@nestjs/common';
import { PageDto } from '../../common/dto';
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
import { UserDto } from '../v2-user/application';
import { PostService } from '../post/post.service';
import { PostBindingService } from '../post/post-binding.service';
import { LogicException } from '../../common/exceptions';
import { HTTP_STATUS_ID } from '../../common/constants';
import { InjectModel } from '@nestjs/sequelize';
import { PostResponseDto } from '../post/dto/responses';

@Injectable()
export class AdminService {
  public constructor(
    private _postService: PostService,
    private _postBindingService: PostBindingService,
    @InjectModel(PostModel)
    protected postModel: typeof PostModel
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
    const postsSorted = await this._postService.getPostsByFilter(
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

    const postsInfo = await this._postService.getPostsByIds(
      postsSorted.map((post) => post.id),
      authUser.id
    );

    const postsBindedData = await this._postBindingService.bindRelatedData(postsInfo, {
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
    getPostDto: GetArticleDto
  ): Promise<PostResponseDto> {
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

    const post = PostHelper.filterArchivedPost(
      await this.postModel.findOne({
        attributes,
        where: condition,
        include,
      })
    );

    if (!post) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }

    const jsonPost = post.toJSON();
    const articlesBindedData = await this._postBindingService.bindRelatedData([jsonPost], {
      shouldBindReaction: true,
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: false,
      authUser: null,
    });
    await this._postBindingService.bindCommunity(articlesBindedData);
    const result = this._classTransformer.plainToInstance(PostResponseDto, articlesBindedData, {
      excludeExtraneousValues: true,
    });

    return result[0];
  }
}
