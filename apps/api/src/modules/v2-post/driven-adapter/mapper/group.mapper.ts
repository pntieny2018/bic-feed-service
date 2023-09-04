import { PRIVACY } from '@beincom/constants';
import { IGroup } from '@libs/service/group/src/interface';
import { Injectable } from '@nestjs/common';

import { GroupPrivacy } from '../../../v2-group/data-type';
import { GroupEntity } from '../../../v2-group/domain/model/group';

@Injectable()
export class GroupMapper {
  public toDomain(group: IGroup): GroupEntity {
    return new GroupEntity({
      id: group.id,
      name: group.name,
      icon: group.icon,
      privacy: group.privacy as unknown as GroupPrivacy,
      communityId: group.communityId,
      rootGroupId: group.rootGroupId,
      isCommunity: group.isCommunity,
      child: group.child,
    });
  }

  public toPersistence(groupEntity: GroupEntity): IGroup {
    return {
      id: groupEntity.get('id'),
      name: groupEntity.get('name'),
      icon: groupEntity.get('icon'),
      communityId: groupEntity.get('communityId'),
      isCommunity: groupEntity.get('isCommunity'),
      privacy: groupEntity.get('privacy') as unknown as PRIVACY,
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
