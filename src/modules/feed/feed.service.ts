import { GetNewsFeedDto } from './dto/request/get-newsfeed.dto';
import { PostResponseDto } from './../post/dto/responses/post.response.dto';
import { ClassTransformer } from 'class-transformer';
import { MentionService } from './../mention/mention.service';
import { GroupService } from './../../shared/group/group.service';
import { PostService } from './../post/post.service';
import { Op } from 'sequelize';
import sequelize from 'sequelize';
import { PageDto } from '../../common/dto';
import { GetTimelineDto } from './dto/request';
import { UserService } from '../../shared/user';
import { InjectModel } from '@nestjs/sequelize';
import { MediaModel } from '../../database/models/media.model';
import { MentionModel } from '../../database/models/mention.model';
import { IPost, PostModel } from '../../database/models/post.model';
import { PostGroupModel } from '../../database/models/post-group.model';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { IPostReaction, PostReactionModel } from '../../database/models/post-reaction.model';

@Injectable()
export class FeedService {
  private readonly _logger = new Logger(FeedService.name);
  private _classTransformer = new ClassTransformer();
  public constructor(
    private readonly _userService: UserService,
    private readonly _groupService: GroupService,
    private readonly _mentionService: MentionService,
    private readonly _postService: PostService,
    @InjectModel(PostModel) private readonly _postModel: typeof PostModel
  ) {}

  /**
   * Get timeline
   * @param authUserId number
   * @param getTimelineDto GetTimelineDto
   * @returns Promise resolve PageDto
   * @throws HttpException
   */
  public async getTimeline(
    authUserId: number,
    getTimelineDto: GetTimelineDto
  ): Promise<PageDto<PostResponseDto>> {
    const { limit, offset, groupId } = getTimelineDto;
    const group = await this._groupService.get(groupId);
    if (!group) {
      throw new BadRequestException(`Group ${groupId} not found`);
    }
    const groupIds = [groupId, ...group.child];
    const constraints = FeedService._getIdConstrains(getTimelineDto);
    const rows = await this._postModel.findAll<PostModel>({
      where: {
        ...constraints,
      },
      attributes: {
        include: [PostModel.loadReactionsCount(), PostModel.importantPostsFirstCondition()],
      },
      include: [
        {
          model: PostGroupModel,
          attributes: ['groupId', 'postId'],
          where: {
            groupId: groupIds,
          },
          required: true,
        },
        {
          model: PostGroupModel,
          attributes: ['groupId', 'postId'],
          required: true,
        },
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
          required: false,
        },
        {
          model: MentionModel,
          required: false,
        },
        {
          model: PostReactionModel,
          as: 'ownerReactions',
          where: {
            createdBy: authUserId,
          },
          required: false,
        },
      ],
      offset: offset,
      limit: limit,
      order: [
        [sequelize.col('isNowImportant'), 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });

    const total = await this._postModel.count({
      where: {
        ...constraints,
      },
      include: [
        {
          model: PostGroupModel,
          attributes: ['groupId', 'postId'],
          where: {
            groupId: groupIds,
          },
          required: true,
        },
      ],
      distinct: true,
    });
    const jsonPosts = rows.map((r) => r.toJSON());
    await this._mentionService.bindMentionsToPosts(jsonPosts);
    await this._postService.bindActorToPost(jsonPosts);
    await this._postService.bindAudienceToPost(jsonPosts);

    const result = this._classTransformer.plainToInstance(PostResponseDto, jsonPosts, {
      excludeExtraneousValues: true,
    });

    return new PageDto<PostResponseDto>(result, {
      total,
      limit,
      offset,
    });
  }

  /**
   * Get newsfeed
   * @param authUserId number
   * @param getNewsFeedDto GetTimelineDto
   * @returns Promise resolve PageDto
   * @throws HttpException
   */
  public async getNewsFeed(
    authUserId: number,
    getNewsFeedDto: GetNewsFeedDto
  ): Promise<PageDto<PostResponseDto>> {
    //get child groups by groupId
    const { limit, offset } = getNewsFeedDto;
    const constraints = FeedService._getIdConstrains(getNewsFeedDto);
    const rows = await this._postModel.findAll<PostModel>({
      where: {
        ...constraints,
      },
      attributes: {
        include: [PostModel.loadReactionsCount(), PostModel.importantPostsFirstCondition()],
      },
      include: [
        {
          model: UserNewsFeedModel,
          attributes: ['userId'],
          where: {
            userId: authUserId,
          },
          required: true,
        },
        {
          model: PostGroupModel,
          attributes: ['groupId', 'postId'],
          required: true,
        },
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
          required: false,
        },
        {
          model: MentionModel,
          required: false,
        },
        {
          model: PostReactionModel,
          as: 'ownerReactions',
          where: {
            createdBy: authUserId,
          },
          required: false,
        },
      ],
      offset: offset,
      limit: limit,
      order: [
        [sequelize.col('isNowImportant'), 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });

    const total = await this._postModel.count({
      where: {
        ...constraints,
      },
      include: [
        {
          model: UserNewsFeedModel,
          attributes: ['userId'],
          where: {
            userId: authUserId,
          },
          required: true,
        },
      ],
      distinct: true,
    });

    const jsonPosts = rows.map((r) => r.toJSON());
    await this._mentionService.bindMentionsToPosts(jsonPosts);
    await this._postService.bindActorToPost(jsonPosts);
    await this._postService.bindAudienceToPost(jsonPosts);

    const result = this._classTransformer.plainToInstance(PostResponseDto, jsonPosts, {
      excludeExtraneousValues: true,
    });

    return new PageDto<PostResponseDto>(result, {
      total,
      limit,
      offset,
    });
  }

  /**
   * Get id constrains
   * @param getTimelineDto GetTimelineDto
   * @returns object
   */
  private static _getIdConstrains(getTimelineDto: GetTimelineDto | GetNewsFeedDto): object {
    const constraints = {};
    if (getTimelineDto.idGT) {
      constraints['id'] = {
        [Op.gt]: getTimelineDto.idGT,
        ...constraints['id'],
      };
    }
    if (getTimelineDto.idGTE) {
      constraints['id'] = {
        [Op.gte]: getTimelineDto.idGTE,
        ...constraints['id'],
      };
    }
    if (getTimelineDto.idLT) {
      constraints['id'] = {
        [Op.lt]: getTimelineDto.idLT,
        ...constraints['id'],
      };
    }
    if (getTimelineDto.idLTE) {
      constraints['id'] = {
        [Op.lte]: getTimelineDto.idLTE,
        ...constraints['id'],
      };
    }
    return constraints;
  }
}
