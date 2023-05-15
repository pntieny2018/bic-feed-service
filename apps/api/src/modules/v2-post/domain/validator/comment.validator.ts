import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PostStatus } from '../../../../database/models/post.model';
import { HTTP_STATUS_ID } from '../../../../common/constants';
import { LogicException } from '../../../../common/exceptions';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../v2-user/application';
import { GroupDto } from '../../../v2-group/application';
import { MediaStatus, PostPrivacy, PostType } from '../../data-type';
import { ContentNoCRUDPermissionException, ContentRequireGroupException } from '../exception';
import { PostAllow } from '../../data-type/post-allow.enum';
import { ICommentValidator } from './interface/comment.validator.interface';
import { ImageDto, UserMentionDto } from '../../application/dto';
import { ContentEntity } from '../model/content/content.entity';

@Injectable()
export class CommentValidator implements ICommentValidator {
  public constructor(
    @Inject(USER_APPLICATION_TOKEN)
    private _userAppService: IUserApplicationService
  ) {}

  /**
   * Check user can read a post policy
   * @param post PostEntity
   * @param user UserDto
   * @param @optional requireGroups GroupDto
   * @throws LogicException
   * @returns void
   */

  public checkCanReadPost(post: ContentEntity, user: UserDto, requireGroups?: GroupDto[]): void {
    if (post.get('status') !== PostStatus.PUBLISHED && post.get('createdBy') === user.id) return;
    if (post.get('privacy') === PostPrivacy.OPEN || post.get('privacy') === PostPrivacy.CLOSED)
      return;
    const groupAudienceIds = post.get('groupIds') ?? [];
    const userJoinedGroupIds = user.groups ?? [];
    const canAccess = groupAudienceIds.some((groupId) => userJoinedGroupIds.includes(groupId));
    if (!canAccess) {
      if (requireGroups && requireGroups.length > 0) {
        throw new ContentRequireGroupException({ requireGroups: requireGroups });
      }

      switch (post.get('type')) {
        case PostType.POST:
        case PostType.ARTICLE:
        case PostType.SERIES:
          throw new ContentNoCRUDPermissionException();
        default:
          throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
      }
    }
  }

  /**
   * Check post policy
   * @param post PostEntity
   * @param action PostAllow
   * @returns Promise resolve boolean
   */
  public allowAction(post: ContentEntity, action: PostAllow): void {
    if (!post.get('setting')[action]) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.API_FORBIDDEN,
        message:
          action === PostAllow.REACT
            ? `React of this post are not available`
            : `Comment of this post are not available`,
      });
    }
  }

  /**
   * Check Valid Mentions
   * @param groupIds
   * @param userIds number[]
   * @return users UserDto[]
   * @throws LogicException
   */
  public async checkValidMentionsAndReturnUsers(
    groupIds: string[],
    userIds: string[]
  ): Promise<UserDto[]> {
    const users = await this._userAppService.findAllByIds(userIds, { withGroupJoined: true });
    for (const user of users) {
      if (!groupIds.some((groupId) => user.groups.includes(groupId))) {
        throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
      }
    }
    return users;
  }

  /**
   * Validate image media properties
   * @param images ImageMetadataDto
   * @param actor UserDto
   * @throws BadRequestException
   * returns void
   */
  public validateImagesMedia(images: ImageDto[], actor: UserDto): void {
    if (images.length === 0) {
      throw new BadRequestException('Invalid image');
    }
    if (images[0]['createdBy'] !== actor.id) {
      throw new BadRequestException('You must be owner this image');
    }
    if (images[0]['status'] !== MediaStatus.DONE) {
      throw new BadRequestException('Image is not ready to use');
    }
  }

  /**
   * Map mentions to UserInfo
   * @param mentions string[]
   * @param users UserDto[]
   * @throws BadRequestException
   * returns UserMentionDto
   */
  public mapMentionWithUserInfo(mentions: string[], users: UserDto[]): UserMentionDto {
    if (users.length < mentions.length) {
      throw new BadRequestException('Mention users not found or resolved');
    }
    return users.reduce((returnValue, current) => {
      return {
        ...returnValue,
        [current.username]: {
          id: current.id,
          username: current.username,
          fullname: current.fullname,
        },
      };
    }, {});
  }
}
