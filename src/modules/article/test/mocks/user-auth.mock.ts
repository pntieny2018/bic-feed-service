import { UserDto } from '../../../auth';
import { UserDataShareDto } from '../../../../shared/user/dto';
import { ObjectHelper } from '../../../../common/helpers';

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

export const actorComment: UserDataShareDto = {
  ...(ObjectHelper.omit(['groups'], mockedUserAuth.profile) as any),
};
export const authUserNotInGroupContainPostMock: UserDto = {
  id: 2,
  username: 'john.kendy',
  avatar: 'https://bein.group/kendy.png',
  email: 'kendy@tgm.vn',
  staffRole: 'normal',
  profile: {
    id: 2,
    fullname: 'John Kendy',
    username: 'john.kendy',
    avatar: 'https://bein.group/kendy.png',
    groups: [3, 4],
  },
};
export const userMentionInGroupMock: UserDataShareDto = {
  id: 2,
  fullname: 'Bret Josh',
  username: 'bret.josh',
  avatar: 'https://bein.group/josh.png',
};

export const userMentionNotInGroupMock: UserDataShareDto = {
  id: 3,
  fullname: 'Caitlyn Back',
  username: 'caitlyn.back',
  avatar: 'https://bein.group/back.png',
};
