import { UserDto } from '../../v2-user/application';

export interface IAuthorityAppService {
  buildAbility(user: UserDto): Promise<void>;
  canCRUDPostArticle(groupIds: string[]): boolean;
  canCRUDSeries(groupIds: string[]): boolean;
  canEditSetting(groupIds: string[]): boolean;
  canPinContent(groupIds: string[]): boolean;
  canDoActionOnGroup(permissionKey: string, groupId: string): boolean;

  // TODO: need to wait the group squad updated build cache permission
  canCudTags(groupId: string): boolean;
}

export const AUTHORITY_APP_SERVICE_TOKEN = 'AUTHORITY_APP_SERVICE_TOKEN';
