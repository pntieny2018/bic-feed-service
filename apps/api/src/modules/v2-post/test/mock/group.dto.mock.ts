import { PRIVACY } from '@beincom/constants';
import { GroupDto } from '@libs/service/group';

export const groupDtoMock: GroupDto = {
  communityId: 'e22e09b2-7956-483a-ab46-87db8a74c09q',
  icon: '',
  id: 'e22e09b2-7956-483a-ab46-87db8a74c09d',
  isCommunity: false,
  name: 'group name',
  privacy: PRIVACY.OPEN,
  rootGroupId: '',
};
