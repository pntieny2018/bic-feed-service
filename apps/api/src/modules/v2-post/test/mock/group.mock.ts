import { PRIVACY } from '@beincom/constants';
import { GroupDto } from '@libs/service/group';
import { v4 } from 'uuid';

export const groupDtoMock: GroupDto = {
  child: undefined,
  communityId: '',
  icon: '',
  id: '',
  isCommunity: false,
  name: '',
  privacy: undefined,
  rootGroupId: '',
};

export function createMockGroupDto(data: Partial<GroupDto> = {}): GroupDto {
  return new GroupDto({
    id: v4(),
    name: 'test group',
    icon: 'http://image.test/abc.jpg',
    communityId: v4(),
    isCommunity: false,
    privacy: PRIVACY.OPEN,
    rootGroupId: v4(),
    ...data,
  });
}
