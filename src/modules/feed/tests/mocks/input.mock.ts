import { GetTimelineDto } from '../../dto/request';
import { GroupDto } from '../../../v2-group/application';
import { GROUP_PRIVACY } from '../../../v2-group/data-type';
import { UserDto } from '../../../v2-user/application';

export const mockedUserAuth: UserDto = {
  id: '26799d29-189b-435d-b618-30fb70e9b09e',
  username: 'martine.baumbach',
  avatar: 'https://bein.group/baumbach.png',
  email: 'baumbach@tgm.vn',
  fullname: 'Martine Baumbach',
  groups: ['26799d29-189b-435d-b618-30fb70e9b09f', '26799d29-189b-435d-b618-30fb70e9b09d'],
};

export const mockGroup: GroupDto = {
  id: '7251dac7-5088-4a33-b900-d1b058edaf90',
  name: 'group 1',
  icon: 'icon 1',
  privacy: GROUP_PRIVACY.OPEN,
  rootGroupId: '855bedeb-b708-4e13-8c68-131d92cd7911',
  isCommunity: false,
  communityId: '11',
  child: {
    open: ['7251dac7-5088-4a33-b900-d1b058edaf98', '7251dac7-5088-4a33-b900-d1b058edaf99'],
    closed: [],
    private: [],
    secret: [],
  },
};

export const mockedGetTimeLineDto: GetTimelineDto = {
  groupId: '7251dac7-5088-4a33-b900-d1b058edaf98',
  offset: 0,
  limit: 5,
};
