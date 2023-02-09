import { Inject } from '@nestjs/common';
import { GroupId } from '../domain/model/group';
import { GroupEntity } from '../domain/model/group/group.entity';
import {
  GROUP_REPOSITORY_TOKEN,
  IGroupRepository,
} from '../domain/repositoty-interface/group.repository.interface';
import { IGroupApplicationService } from './group.app-service.interface';

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
