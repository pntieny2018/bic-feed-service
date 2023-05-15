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
import { PostEntity } from '../model/content/post.entity';
import { PostAllow } from '../../data-type/post-allow.enum';
import { ImageMetadataDto } from '../../driving-apdater/dto/shared/media';
import { ICommentValidator } from './interface/comment.validator.interface';

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

  public checkCanReadPost(post: PostEntity, user: UserDto, requireGroups?: GroupDto[]): void {
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
  public allowAction(post: PostEntity, action: PostAllow): void {
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
   * @throws LogicException
   */
  public async checkValidMentions(groupIds: string[], userIds: string[]): Promise<void> {
    const users = await this._userAppService.findAllByIds(userIds, { withGroupJoined: true });
    for (const user of users) {
      if (!groupIds.some((groupId) => user.groups.includes(groupId))) {
        throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
      }
    }
  }

  /**
   * Validate image media properties
   * @param images ImageMetadataDto
   * @param actor UserDto
   * @throws BadRequestException
   * returns void
   */
  public validateImagesMedia(images: ImageMetadataDto[], actor: UserDto): void {
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
}
