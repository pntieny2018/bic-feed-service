import { UserDto } from '../../../auth';
import { UserDataShareDto } from '../../../../shared/user/dto';
import { ObjectHelper } from '../../../../common/helpers';

export const mockedUserAuth: UserDto = {
  id: '7251dac7-5088-4a33-b900-d1b058edaf98',
  username: 'martine.baumbach',
  avatar: 'https://bein.group/baumbach.png',
  email: 'baumbach@tgm.vn',
  fullname: 'Martine Baumbach',
  groups: ['7251dac7-5088-4a33-b900-d1b058edaf99', '7251dac7-5088-4a33-b900-d1b058edaf90'],
};

export const actorComment: UserDataShareDto = {
  ...(ObjectHelper.omit(['groups'], mockedUserAuth) as any),
};
export const authUserNotInGroupContainPostMock: UserDto = {
  id: 'ac2ca6ee-900e-40e2-b2b5-5e96c9bb5637',
  username: 'john.kendy',
  avatar: 'https://bein.group/kendy.png',
  email: 'kendy@tgm.vn',
  fullname: 'John Kendy',
  groups: ['ac2ca6ee-900e-40e2-b2b5-5e96c9bb5636', 'ac2ca6ee-900e-40e2-b2b5-5e96c9bb5635'],
};
export const userMentionInGroupMock: UserDataShareDto = {
  id: 'ac2ca6ee-900e-40e2-b2b5-5e96c9bb5638',
  fullname: 'Bret Josh',
  username: 'bret.josh',
  avatar: 'https://bein.group/josh.png',
};

export const userMentionNotInGroupMock: UserDataShareDto = {
  id: 'ac2ca6ee-900e-40e2-b2b5-5e96c9bb5639',
  fullname: 'Caitlyn Back',
  username: 'caitlyn.back',
  avatar: 'https://bein.group/back.png',
};
