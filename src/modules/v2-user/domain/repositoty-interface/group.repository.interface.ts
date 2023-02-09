import { GroupId } from '../model/user';
import { GroupEntity } from '../model/user/group.entity';

export interface IGroupRepository {
  findOne(id: GroupId): Promise<GroupEntity>;
  findAllByIds(ids: GroupId[]): Promise<GroupEntity[]>;
}

export const GROUP_REPOSITORY_TOKEN = 'GROUP_REPOSITORY_TOKEN';
