import { UserDto } from '../../../auth';
import { UserDataShareDto } from '../../../../shared/user/dto';
import { ObjectHelper } from '../../../../common/helpers';

export const authUserMock: UserDto = {
  id: '26799d29-189b-435d-b618-30fb70e9b09e',
  username: 'martine.baumbach',
  avatar: 'https://bein.group/baumbach.png',
  email: 'baumbach@tgm.vn',
  fullname: 'Martine Baumbach',
  groups: ['26799d29-189b-435d-b618-30fb70e9b09a', '26799d29-189b-435d-b618-30fb70e9b09b'],
};

export const actorComment: UserDataShareDto = {
  ...(ObjectHelper.omit(['groups'], authUserMock) as any),
};
export const authUserNotInGroupContainPostMock: UserDto = {
  id: '26799d29-189b-435d-b618-30fb70e9b09d',
  username: 'john.kendy',
  avatar: 'https://bein.group/kendy.png',
  email: 'kendy@tgm.vn',
  fullname: 'John Kendy',
  groups: ['26799d29-189b-435d-b618-30fb70e9b09c', '26799d29-189b-435d-b618-30fb70e9b09b'],
};
export const userMentionInGroupMock: UserDataShareDto = {
  id: '26799d29-189b-435d-b618-30fb70e9b09d',
  fullname: 'Bret Josh',
  username: 'bret.josh',
  avatar: 'https://bein.group/josh.png',
};

export const userMentionNotInGroupMock: UserDataShareDto = {
  id: '26799d29-189b-435d-b618-30fb70e9b09e',
  fullname: 'Caitlyn Back',
  username: 'caitlyn.back',
  avatar: 'https://bein.group/back.png',
};
