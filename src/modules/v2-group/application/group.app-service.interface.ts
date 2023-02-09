import { GroupId } from '../domain/model/group';
import { GroupEntity } from '../domain/model/group/group.entity';

export interface IGroupApplicationService {
  findOne(id: GroupId): Promise<GroupEntity>;
  findAllByIds(ids: GroupId[]): Promise<GroupEntity[]>;
}

export const GROUP_APPLICATION_TOKEN = 'GROUP_APPLICATION_TOKEN';
