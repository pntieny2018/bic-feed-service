import { UserDto } from '../../../../v2-user/application';
import { ContentEntity } from '../../model/content/content.entity';
import { GroupDto } from '../../../../v2-group/application/group.dto';
import { PostType } from '../../../data-type';
import { TagEntity } from '../../model/tag';

export interface IContentValidator {
  checkCanCRUDContent(
    user: UserDto,
    groupAudienceIds: string[],
    postType?: PostType
  ): Promise<void>;

  checkCanEditContentSetting(user: UserDto, groupAudienceIds: string[]): Promise<void>;

  validatePublishContent(
    contentEntity: ContentEntity,
    userAuth: UserDto,
    groupIds: string[]
  ): Promise<void>;

  validateMentionUsers(userIds: string[], groupIds: string[]): Promise<void>;

  checkCanReadContent(post: ContentEntity, user: UserDto, postGroupsData?: GroupDto[]): void;

  validateSeriesAndTags(groups: GroupDto[], seriesIds: string[], tags: TagEntity[]): Promise<void>;
}

export const CONTENT_VALIDATOR_TOKEN = 'CONTENT_VALIDATOR_TOKEN';
