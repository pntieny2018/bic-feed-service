import { GroupPrivacy, GroupSharedDto } from '../../../../shared/group/dto';
import { UserDto } from '../../../auth';
import { GetTimelineDto } from '../../dto/request';

export const mockedUserAuth: UserDto = {
  id: '26799d29-189b-435d-b618-30fb70e9b09e',
  username: 'martine.baumbach',
  avatar: 'https://bein.group/baumbach.png',
  email: 'baumbach@tgm.vn',
  staffRole: 'normal',
  profile: {
    id: '26799d29-189b-435d-b618-30fb70e9b09e',
    fullname: 'Martine Baumbach',
    username: 'martine.baumbach',
    avatar: 'https://bein.group/baumbach.png',
    groups: ['26799d29-189b-435d-b618-30fb70e9b09f', '26799d29-189b-435d-b618-30fb70e9b09d'],
  },
};

export const mockGroup: GroupSharedDto = {
  id: '7251dac7-5088-4a33-b900-d1b058edaf90',
  name: 'group 1',
  icon: 'icon 1',
  privacy: GroupPrivacy.PUBLIC,
  rootGroupId: '855bedeb-b708-4e13-8c68-131d92cd7911',
  child: {
    public: ['7251dac7-5088-4a33-b900-d1b058edaf98', '7251dac7-5088-4a33-b900-d1b058edaf99'],
    open: [],
    private: [],
    secret: [],
  },
};

export const mockedGetTimeLineDto: GetTimelineDto = {
  groupId: '7251dac7-5088-4a33-b900-d1b058edaf98',
  offset: 0,
  limit: 5,
};
