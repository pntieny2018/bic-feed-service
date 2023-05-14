import { UserDto } from '../../../../v2-user/application';
import { ContentEntity } from '../../model/post/content.entity';

export interface IContentValidator {
  checkCanCRUDContent(user: UserDto, groupAudienceIds: string[]): Promise<void>;

  checkCanEditContentSetting(user: UserDto, groupAudienceIds: string[]): Promise<void>;

  validatePublishContent(contentEntity: ContentEntity, userAuth: UserDto, groupIds: string[]): void;
}

export const CONTENT_VALIDATOR_TOKEN = 'CONTENT_VALIDATOR_TOKEN';
