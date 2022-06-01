import { GroupPrivacy, GroupSharedDto } from '../../../../shared/group/dto';
import { UserDto } from '../../../auth';
import { GetTimelineDto } from '../../dto/request';

export const mockedUserAuth: UserDto = {
  id: 1,
  username: 'martine.baumbach',
  avatar: 'https://bein.group/baumbach.png',
  email: 'baumbach@tgm.vn',
  staffRole: 'normal',
  profile: {
    id: 1,
    fullname: 'Martine Baumbach',
    username: 'martine.baumbach',
    avatar: 'https://bein.group/baumbach.png',
    groups: [1, 2],
  },
};

export const mockGroup: GroupSharedDto = {
  id: 1,
  name: 'group 1',
  icon: 'icon 1',
  privacy: GroupPrivacy.PUBLIC,
  child: {
    public: [2, 3],
    open: [],
    private: [],
    secret: [],
  },
};

export const mockedGetTimeLineDto: GetTimelineDto = {
  groupId: 2,
  offset: 0,
  limit: 5,
};
