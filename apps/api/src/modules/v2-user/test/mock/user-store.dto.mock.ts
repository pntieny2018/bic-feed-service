export const bfProfile = {
  id: 'f28b0363-53f7-44ad-a59b-f20ed177bb73',
  city: 'Hồ Chí Minh',
  email: 'bein@tgm.vn',
  phone: '909114421',
  avatar:
    'https://media.beincom.io/image/variants/user/avatar/02795274-4ccc-4686-968c-008b695c2ff2',
  gender: 'FEMALE',
  address: null,
  country: 'VietNam',
  username: 'beintest',
  fullname: 'Bein',
  language: ['en', 'vi'],
  birthday: '2014-12-04T17:00:00.000Z',
  createdAt: '2022-07-13T07:44:32.779Z',
  updatedAt: '2023-05-04T09:26:01.345Z',
  deletedAt: null,
  chatId: '5x9n8k9phbb4xkbzbnprx568zy',
  countryCode: '+84',
  description: null,
  beinStaffRole: 'STAFF',
  backgroundImgUrl:
    'https://media.beincom.io/image/variants/user/cover/56600ff5-3238-4d35-aaa5-769f93d60dc1',
  relationshipStatus: 'IN_A_RELATIONSHIP',
  isDeactivated: false,
  isVerified: true,
};

export const cacheSU = {
  id: 'f28b0363-53f7-44ad-a59b-f20ed177bb73',
  username: 'beintest',
  fullname: 'Bein',
  avatar:
    'https://media.beincom.io/image/variants/user/avatar/02795274-4ccc-4686-968c-008b695c2ff2',
  email: 'giabao@tgm.vn',
  isDeactivated: false,
  isVerified: true,
  blockings: ['6235bc91-2255-4f4b-bcfa-bebcd24e27ac'],
  groups: ['7577d52d-bccb-46a1-8a8d-a0ae1e231c9f'],
};

export const cacheSG = {
  child: {
    closed: [],
    open: ['c87c7ad5-8331-4003-873a-baccd545d88f'],
    secret: [],
    private: [],
  },
  id: '7577d52d-bccb-46a1-8a8d-a0ae1e231c9f',
  name: 'Bein Back-end Bein Group',
  icon: null,
  privacy: 'OPEN',
  rootGroupId: '35b5fb8f-6f7a-4ac2-90bb-18199096c429',
  communityId: '15337361-1577-4b7b-a31d-990df06aa446',
};

export const permissionCacheKey = {
  communities: {
    '15337361-1577-4b7b-a31d-990df06aa446': [
      'crud_post_article',
      'send_message',
      'edit_own_message',
      'delete_own_message',
      'edit_own_content_setting',
    ],
    '58e1461a-f811-4db5-8780-24af9d4c4834': [
      'crud_post_article',
      'send_message',
      'edit_own_message',
      'delete_own_message',
    ],
  },
  groups: {
    '7577d52d-bccb-46a1-8a8d-a0ae1e231c9f': [
      'crud_post_article',
      'send_message',
      'edit_own_message',
      'delete_own_message',
      'edit_own_content_setting',
    ],
  },
  version: 2,
};
