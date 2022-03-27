import { UserDto } from '../../../dto';

export const userInfoExpect: UserDto = {
  email: 'tronghm@evol.group',
  username: 'tronghm',
  id: 4,
  staffRole: 'ADMINISTRATOR',
  profile: {
    id: 4,
    username: 'tronghm',
    fullname: 'Hoàng Minh Trọng',
    avatar:
      'https://bein-development-storage.s3.ap-southeast-1.amazonaws.com/public/a/f9/af95058bbbc7ace1630495801f5b8694.JPG',
    groups: [1, 2],
  },
};
