import { UserDto } from '../../../auth';

export const mockedUserAuth: UserDto = {
  id: 1,
  username: 'baoquan',
  avatar: 'https://beincomm.org/baoquan.png',
  email: 'baoquan@tgm.vn',
  staffRole: 'normal',
  profile: {
    id: 1,
    fullname: 'Bao Quan',
    username: 'baoquan',
    avatar: 'https://beincomm.org/baoquan.png',
    groups: [1, 2],
  },
};
