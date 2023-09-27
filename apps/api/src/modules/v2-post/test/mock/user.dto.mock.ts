import { UserDto } from '@libs/service/user';

export const userMock: UserDto = {
  fullname: 'Admin EVOL',
  id: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
  username: 'admin',
  email: 'admin@tgm.vn',
  avatar:
    'https://bic-dev-entity-attribute-s3-bucket.s3.ap-southeast-1.amazonaws.com/static/user/default-avatar.png',
  groups: ['a29bfb75-4d07-4f7c-9bb1-e1fdffead4ec'],
};

export const userMentions: UserDto[] = [
  {
    id: '7251dac7-5088-4a33-b900-d1b058edaf98',
    username: 'martine.baumbach',
    avatar: 'https://bein.group/baumbach.png',
    email: 'baumbach@tgm.vn',
    fullname: 'Martine Baumbach',
    groups: ['7251dac7-5088-4a33-b900-d1b058edaf99', '7251dac7-5088-4a33-b900-d1b058edaf90'],
  },
];
