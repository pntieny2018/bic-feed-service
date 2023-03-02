import { GroupEntity } from '../model/group';

export interface IGroupRepository {
  findOne(groupId: string): Promise<GroupEntity>;

  findAllByIds(groupIds: string[]): Promise<GroupEntity[]>;
}

export const GROUP_REPOSITORY_TOKEN = 'GROUP_REPOSITORY_TOKEN';
