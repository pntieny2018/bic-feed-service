import { Inject } from '@nestjs/common';
import { GroupEntity } from '../domain/model/group';
import {
  GROUP_REPOSITORY_TOKEN,
  IGroupRepository,
} from '../domain/repositoty-interface/group.repository.interface';
import { IGroupApplicationService } from './group.app-service.interface';
import { GroupDto } from './group.dto';

export class GroupApplicationService implements IGroupApplicationService {
  @Inject(GROUP_REPOSITORY_TOKEN)
  private readonly _repo: IGroupRepository;

  public async findOne(groupId: string): Promise<GroupDto> {
    const data = await this._repo.findOne(groupId);
    return this._toDto(data);
  }

  public async findAllByIds(groupIds: string[]): Promise<GroupDto[]> {
    const rows = await this._repo.findAllByIds(groupIds);

    return rows.map((row) => this._toDto(row));
  }

  private _toDto(groupEntity: GroupEntity): GroupDto {
    return {
      id: groupEntity.get('id'),
      name: groupEntity.get('name'),
      icon: groupEntity.get('icon'),
      communityId: groupEntity.get('communityId'),
      isCommunity: groupEntity.get('isCommunity'),
      privacy: groupEntity.get('privacy'),
      rootGroupId: groupEntity.get('rootGroupId'),
      child: {
        closed: groupEntity.get('child').closed.map((item) => item),
        open: groupEntity.get('child').open.map((item) => item),
        private: groupEntity.get('child').private.map((item) => item),
        secret: groupEntity.get('child').secret.map((item) => item),
      },
    };
  }
}
