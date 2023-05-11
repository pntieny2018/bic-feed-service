import { Ability } from '@casl/ability';
import { UserDto } from '../../v2-user/application';

export interface IAuthorityAppService {
  buildAbility(user: UserDto): Promise<Ability>;
}

export const AUTHORITY_APP_SERVICE_TOKEN = 'AUTHORITY_APP_SERVICE_TOKEN';
