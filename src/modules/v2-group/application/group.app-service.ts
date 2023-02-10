import { Inject } from '@nestjs/common';
import { GroupEntity, GroupId } from '../domain/model/group';
import {
  GROUP_REPOSITORY_TOKEN,
  IGroupRepository,
} from '../domain/repositoty-interface/group.repository.interface';
import { IGroupApplicationService } from './group.app-service.interface';
import { GroupDto } from './group.dto';

export class GroupApplicationService implements IGroupApplicationService {
  @Inject(GROUP_REPOSITORY_TOKEN)
  private readonly _repo: IGroupRepository;

  public async findOne(id: string): Promise<GroupDto> {
    const data = await this._repo.findOne(GroupId.fromString(id));
    return this._toDto(data);
  }

  public async findAllByIds(ids: string[]): Promise<GroupDto[]> {
    const groupIds = ids.map((id) => GroupId.fromString(id));
    const rows = await this._repo.findAllByIds(groupIds);

    return rows.map((row) => this._toDto(row));
  }

  private _toDto(groupEntity: GroupEntity): GroupDto {
    return {
      id: groupEntity.get('id').value,
      name: groupEntity.get('name').value,
      icon: groupEntity.get('icon').value,
      communityId: groupEntity.get('communityId').value,
      isCommunity: groupEntity.get('isCommunity'),
      privacy: groupEntity.get('privacy').value,
      rootGroupId: groupEntity.get('rootGroupId').value,
      child: {
        closed: groupEntity.get('child').closed.map((item) => item.value),
        open: groupEntity.get('child').open.map((item) => item.value),
        private: groupEntity.get('child').private.map((item) => item.value),
        secret: groupEntity.get('child').secret.map((item) => item.value),
      },
    };
  }
}
