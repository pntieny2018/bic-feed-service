import { ObjectHelper } from '../../../../common/helpers';
import { UserDto } from '../../../v2-user/application';

export const mockedUserAuth: UserDto = {
  id: '855bedeb-b708-4e13-8c68-131d92cd79b2',
  username: 'martine.baumbach',
  avatar: 'https://bein.group/baumbach.png',
  email: 'baumbach@tgm.vn',
  fullname: 'Martine Baumbach',
  groups: ['855bedeb-b708-4e13-8c68-131d92cd79b3', '855bedeb-b708-4e13-8c68-131d92cd79b4'],
};

export const actorComment = {
  ...(ObjectHelper.omit(['groups'], mockedUserAuth) as any),
};
export const authUserNotInGroupContainPostMock: UserDto = {
  id: '855bedeb-b708-4e13-8c68-131d92cd79b2',
  username: 'john.kendy',
  avatar: 'https://bein.group/kendy.png',
  email: 'kendy@tgm.vn',
  fullname: 'John Kendy',
  groups: ['855bedeb-b708-4e13-8c68-131d92cd79b3', '855bedeb-b708-4e13-8c68-131d92cd79b4'],
};
export const userMentionInGroupMock = {
  id: '855bedeb-b708-4e13-8c68-131d92cd79b2',
  fullname: 'Bret Josh',
  username: 'bret.josh',
  avatar: 'https://bein.group/josh.png',
};

export const userMentionNotInGroupMock = {
  id: '855bedeb-b708-4e13-8c68-131d92cd79b3',
  fullname: 'Caitlyn Back',
  username: 'caitlyn.back',
  avatar: 'https://bein.group/back.png',
};
