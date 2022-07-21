import { UserDto } from '../../../auth';
import { UserDataShareDto } from '../../../../shared/user/dto';
import { ObjectHelper } from '../../../../common/helpers';

export const mockedUserAuth: UserDto = {
  id: '855bedeb-b708-4e13-8c68-131d92cd79b2',
  username: 'martine.baumbach',
  avatar: 'https://bein.group/baumbach.png',
  email: 'baumbach@tgm.vn',
  staffRole: 'normal',
  profile: {
    id: '855bedeb-b708-4e13-8c68-131d92cd79b2',
    fullname: 'Martine Baumbach',
    username: 'martine.baumbach',
    avatar: 'https://bein.group/baumbach.png',
    groups: ['855bedeb-b708-4e13-8c68-131d92cd79b3', '855bedeb-b708-4e13-8c68-131d92cd79b4'],
  },
};

export const actorComment: UserDataShareDto = {
  ...(ObjectHelper.omit(['groups'], mockedUserAuth.profile) as any),
};
export const authUserNotInGroupContainPostMock: UserDto = {
  id: '855bedeb-b708-4e13-8c68-131d92cd79b2',
  username: 'john.kendy',
  avatar: 'https://bein.group/kendy.png',
  email: 'kendy@tgm.vn',
  staffRole: 'normal',
  profile: {
    id: '855bedeb-b708-4e13-8c68-131d92cd79b2',
    fullname: 'John Kendy',
    username: 'john.kendy',
    avatar: 'https://bein.group/kendy.png',
    groups: ['855bedeb-b708-4e13-8c68-131d92cd79b3', '855bedeb-b708-4e13-8c68-131d92cd79b4'],
  },
};
export const userMentionInGroupMock: UserDataShareDto = {
  id: '855bedeb-b708-4e13-8c68-131d92cd79b2',
  fullname: 'Bret Josh',
  username: 'bret.josh',
  avatar: 'https://bein.group/josh.png',
};

export const userMentionNotInGroupMock: UserDataShareDto = {
  id: '855bedeb-b708-4e13-8c68-131d92cd79b3',
  fullname: 'Caitlyn Back',
  username: 'caitlyn.back',
  avatar: 'https://bein.group/back.png',
};
