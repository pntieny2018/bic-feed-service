import { Injectable } from '@nestjs/common';
import { PageDto } from '../../common/dto';
import { ArticleResponseDto } from '../article/dto/responses';
import { GetsByAdminDto } from './dto/requests/gets-by-admin.dto';
import { PostModel, PostType } from '../../database/models/post.model';
import { PostHelper } from '../post/post.helper';
import { ClassTransformer } from 'class-transformer';
import { UserDto } from '../v2-user/application';
import { PostService } from '../post/post.service';
import { PostBindingService } from '../post/post-binding.service';
import { LogicException } from '../../common/exceptions';
import { HTTP_STATUS_ID } from '../../common/constants';
import { InjectModel } from '@nestjs/sequelize';
import { SeriesService } from '../series/series.service';
import { ArticleService } from '../article/article.service';

@Injectable()
export class AdminService {
  public constructor(
    private _postService: PostService,
    private _articleService: ArticleService,
    private _seriesService: SeriesService,
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

  public async getPostDetail(postId: string, user: UserDto): Promise<any> {
    //TODO: check admin

    const post = await this.postModel.findOne({
      attributes: ['id', 'type'],
      where: { id: postId },
    });

    if (!post) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }
    if (post.type === PostType.POST) {
      return this._postService.get(postId, user, {
        withComment: false,
        hideSecretAudienceCanNotAccess: false,
      });
    }
    if (post.type === PostType.ARTICLE) {
      return this._articleService.get(postId, user, {
        withComment: false,
        hideSecretAudienceCanNotAccess: false,
      });
    }
    if (post.type === PostType.SERIES) {
      return this._seriesService.get(postId, user, {
        withComment: false,
        hideSecretAudienceCanNotAccess: false,
      });
    }
  }
}
