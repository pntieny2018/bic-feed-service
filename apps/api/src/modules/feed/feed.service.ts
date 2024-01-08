import { PRIVACY } from '@beincom/constants';
import {
  PostAttributes,
  PostGroupModel,
  PostModel,
  UserSeenPostModel,
} from '@libs/database/postgres/model';
import { SentryService } from '@libs/infra/sentry';
import { GROUP_SERVICE_TOKEN, GroupService } from '@libs/service/group';
import { IUserService, USER_SERVICE_TOKEN, UserDto } from '@libs/service/user';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { PageDto, PageMetaDto } from '../../common/dto';
import { DomainForbiddenException } from '../../common/exceptions';
import { ContentNotFoundException } from '../v2-post/domain/exception';

import { GetUserSeenPostDto } from './dto/request/get-user-seen-post.dto';

@Injectable()
export class FeedService {
  private readonly _logger = new Logger(FeedService.name);

  public constructor(
    @Inject(USER_SERVICE_TOKEN)
    private readonly _userService: IUserService,
    @Inject(GROUP_SERVICE_TOKEN)
    private readonly _groupAppService: GroupService,
    private _sentryService: SentryService,
    @InjectModel(UserSeenPostModel)
    private _userSeenPostModel: typeof UserSeenPostModel,
    @InjectModel(PostModel)
    protected postModel: typeof PostModel
  ) {}

  public async getUsersSeenPosts(
    user: UserDto,
    getUserSeenPostDto: GetUserSeenPostDto
  ): Promise<PageDto<UserDto>> {
    try {
      const { postId } = getUserSeenPostDto;

      const post = await this._findPostById(postId);
      const groupsOfUser = user.groups;
      const groupIds = post.groups.map((g) => g.groupId);
      const groupInfos = await this._groupAppService.findAllByIds(groupIds);

      const privacy = groupInfos.map((g) => g.privacy);

      if (privacy.every((p) => p !== PRIVACY.CLOSED && p !== PRIVACY.OPEN)) {
        if (!groupIds.some((groupId) => groupsOfUser.includes(groupId))) {
          throw new DomainForbiddenException();
        }
      }

      const usersSeenPost = await this._userSeenPostModel.findAll({
        where: {
          postId: postId,
        },
        order: [['createdAt', 'DESC']],
        limit: getUserSeenPostDto?.limit || 20,
        offset: getUserSeenPostDto?.offset || 0,
      });

      const total = await this._userSeenPostModel.count({
        where: {
          postId: postId,
        },
      });

      const users = await this._userService.findAllByIds(usersSeenPost.map((usp) => usp.userId));

      return new PageDto<UserDto>(
        users,
        new PageMetaDto({
          total: total ?? 0,
          pageOptionsDto: {
            limit: getUserSeenPostDto?.limit || 20,
            offset: getUserSeenPostDto?.offset || 0,
          },
        })
      );
    } catch (ex) {
      this._logger.error(JSON.stringify(ex?.stack));
      this._sentryService.captureException(ex);
      throw ex;
    }
  }

  private async _findPostById(id: string): Promise<PostAttributes> {
    const post = await this.postModel.findOne({
      include: [
        {
          model: PostGroupModel,
          as: 'groups',
        },
      ],
      where: {
        id,
      },
    });

    if (!post) {
      throw new ContentNotFoundException();
    }
    return post.toJSON();
  }
}
