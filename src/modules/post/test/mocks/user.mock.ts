import { ObjectHelper } from '../../../../common/helpers';
import { UserDto } from '../../../v2-user/application';

export const mockedUserAuth: UserDto = {
  id: '7251dac7-5088-4a33-b900-d1b058edaf98',
  username: 'martine.baumbach',
  avatar: 'https://bein.group/baumbach.png',
  email: 'baumbach@tgm.vn',
  fullname: 'Martine Baumbach',
  groups: ['7251dac7-5088-4a33-b900-d1b058edaf99', '7251dac7-5088-4a33-b900-d1b058edaf90'],
};

export const actorComment: UserDto = {
  ...(ObjectHelper.omit(['groups'], mockedUserAuth) as any),
};
export const authUserNotInGroupContainPostMock = {
  id: 'ac2ca6ee-900e-40e2-b2b5-5e96c9bb5637',
  username: 'john.kendy',
  avatar: 'https://bein.group/kendy.png',
  email: 'kendy@tgm.vn',
  fullname: 'John Kendy',
  groups: ['ac2ca6ee-900e-40e2-b2b5-5e96c9bb5636', 'ac2ca6ee-900e-40e2-b2b5-5e96c9bb5635'],
};
export const userMentionInGroupMock = {
  id: 'ac2ca6ee-900e-40e2-b2b5-5e96c9bb5638',
  fullname: 'Bret Josh',
  username: 'bret.josh',
  avatar: 'https://bein.group/josh.png',
};

export const userMentionNotInGroupMock = {
  id: 'ac2ca6ee-900e-40e2-b2b5-5e96c9bb5639',
  fullname: 'Caitlyn Back',
  username: 'caitlyn.back',
  avatar: 'https://bein.group/back.png',
};
