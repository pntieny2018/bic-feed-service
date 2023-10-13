import { CONTENT_TYPE } from '@beincom/constants';
import { GroupDto } from '@libs/service/group';
import { UserDto } from '@libs/service/user';

import { ContentEntity } from '../../model/content';
import { TagEntity } from '../../model/tag';

export interface IContentValidator {
  checkCanCRUDContent(
    user: UserDto,
    groupAudienceIds: string[],
    postType?: CONTENT_TYPE
  ): Promise<void>;

  checkCanEditContentSetting(user: UserDto, groupAudienceIds: string[]): Promise<void>;

  validatePublishContent(
    contentEntity: ContentEntity,
    userAuth: UserDto,
    groupIds: string[]
  ): Promise<void>;

  validateMentionUsers(userIds: string[], groupIds: string[]): Promise<void>;

  checkCanReadContent(
    post: ContentEntity,
    user: UserDto,
    postGroupsData?: GroupDto[]
  ): Promise<void>;

  validateSeriesAndTags(groups: GroupDto[], seriesIds: string[], tags: TagEntity[]): Promise<void>;

  validateScheduleTime(scheduleAt: Date): void;

  checkCanPinContent(user: UserDto, groupIds: string[]): Promise<void>;
}

export const CONTENT_VALIDATOR_TOKEN = 'CONTENT_VALIDATOR_TOKEN';
