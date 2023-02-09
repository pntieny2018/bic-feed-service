import { GroupId } from '../../../postv2/domain/model/group';
import { GroupEntity } from '../model/group/group.entity';

export interface IGroupRepository {
  findOne(id: GroupId): Promise<GroupEntity>;
  findAllByIds(ids: GroupId[]): Promise<GroupEntity[]>;
}

export const GROUP_REPOSITORY_TOKEN = 'GROUP_REPOSITORY_TOKEN';
