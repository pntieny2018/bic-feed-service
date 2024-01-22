import { CONTENT_TYPE } from '@beincom/constants';
import { GroupDto } from '@libs/service/group';
import { UserDto } from '@libs/service/user';

import { ArticleEntity, ContentEntity, PostEntity } from '../../model/content';
import { TagEntity } from '../../model/tag';

export interface IContentValidator {
  checkCanCRUDContent(input: {
    user: UserDto;
    groupIds: string[];
    contentType?: CONTENT_TYPE;
    groups?: GroupDto[];
  }): Promise<void>;

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
    options?: {
      dataGroups?: GroupDto[];
    }
  ): Promise<void>;

  validateContentReported(contentId: string, userId: string): Promise<void>;

  validateContentArchived(user: UserDto, postGroupIds: string[]): Promise<void>;

  checkCanReadNotPublishedContent(contentEntity: ContentEntity, userId: string): Promise<void>;

  validateSeriesAndTags(groups: GroupDto[], seriesIds: string[], tags: TagEntity[]): Promise<void>;

  validateScheduleTime(scheduleAt: Date): void;

  checkCanPinContent(user: UserDto, groupIds: string[]): Promise<void>;

  validateLimitedToAttachSeries(contentEntity: ArticleEntity | PostEntity): Promise<void>;
}

export const CONTENT_VALIDATOR_TOKEN = 'CONTENT_VALIDATOR_TOKEN';
