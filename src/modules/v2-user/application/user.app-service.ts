import { Inject } from '@nestjs/common';
import { GroupId } from '../domain/model/user';
import { GroupEntity } from '../domain/model/user/group.entity';
import {
  GROUP_REPOSITORY_TOKEN,
  IGroupRepository,
} from '../domain/repositoty-interface/group.repository.interface';
import { IGroupApplicationService } from './user.app-service.interface';

export class GroupApplicationService implements IGroupApplicationService {
  @Inject(GROUP_REPOSITORY_TOKEN)
  private readonly _repo: IGroupRepository;
  public async findOne(id: GroupId): Promise<GroupEntity> {
    return this._repo.findOne(id);
  }

  public async findAllByIds(ids: GroupId[]): Promise<GroupEntity[]> {
    return this._repo.findAllByIds(ids);
  }
}
