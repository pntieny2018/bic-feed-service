import { Ability } from '@casl/ability';
import { UserDto } from '../../v2-user/application';

export interface IAuthorityAppService {
  buildAbility(user: UserDto): Promise<Ability>;
  canCRUDPostArticle(groupIds: string[]): boolean;
  canEditSetting(groupIds: string[]): boolean;
  canPinContent(groupIds: string[]): boolean;
}

export const AUTHORITY_APP_SERVICE_TOKEN = 'AUTHORITY_APP_SERVICE_TOKEN';
