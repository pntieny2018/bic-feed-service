import { GroupDto } from './group.dto';

export interface IGroupApplicationService {
  findOne(id: string): Promise<GroupDto>;
  findAllByIds(ids: string[]): Promise<GroupDto[]>;
}

export const GROUP_APPLICATION_TOKEN = 'GROUP_APPLICATION_TOKEN';
