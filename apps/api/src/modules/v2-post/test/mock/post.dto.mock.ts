import { CONTENT_STATUS, CONTENT_TYPE, PRIVACY } from '@beincom/constants';

import { PostDto } from '../../application/dto';

export const postMock: PostDto = {
  id: 'ff09eb67-3319-4c0a-9e15-04cf14358ae7',
  audience: {
    groups: [
      {
        id: 'e22e09b2-7956-483a-ab46-87db8a74c09d',
        name: 'Cộng đồng thích Dragon Ball',
        icon: 'https://evolgroup.vn/wp-content/uploads/sites/18/2020/04/Thumb-EVOL.jpg',
        communityId: '0204fff4-1269-4213-a1a6-4d60be69af0d',
        isCommunity: true,
        privacy: PRIVACY.OPEN,
        rootGroupId: 'e22e09b2-7956-483a-ab46-87db8a74c09d',
      },
    ],
  },
  content: '1111',
  wordCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: [],
  series: [
    {
      id: '72acc501-6c18-47c6-b549-9f7af98948d8',
      title: 'Dragon Ball',
    },
  ],
  communities: [
    {
      id: 'e22e09b2-7956-483a-ab46-87db8a74c09d',
      name: 'Cộng đồng thích Dragon Ball',
      icon: 'https://evolgroup.vn/wp-content/uploads/sites/18/2020/04/Thumb-EVOL.jpg',
      communityId: '0204fff4-1269-4213-a1a6-4d60be69af0d',
      isCommunity: true,
      privacy: PRIVACY.OPEN,
      rootGroupId: 'e22e09b2-7956-483a-ab46-87db8a74c09d',
    },
  ],
  media: {
    files: [],
    images: [],
    videos: [],
  },
  mentions: {},
  actor: {
    id: '7b63852c-5249-499a-a32b-6bdaa2761fc2',
    username: 'trannamanh',
    fullname: 'Nam Anh',
    email: 'namanh@tgm.vn',
    avatar:
      'https://media.beincom.io/image/variants/user/avatar/1e65c01e-7916-46aa-b5a8-aeea19cfef97',
    isDeactivated: false,
    isVerified: false,
  },
  status: CONTENT_STATUS.PUBLISHED,
  type: CONTENT_TYPE.POST,
  privacy: PRIVACY.OPEN,
  setting: {
    canComment: true,
    canReact: true,
    importantExpiredAt: null,
    isImportant: false,
  },
  commentsCount: 3,
  totalUsersSeen: 14,
  markedReadPost: true,
  isSaved: false,
  isReported: false,
  reactionsCount: [],
  ownerReactions: [],
};
