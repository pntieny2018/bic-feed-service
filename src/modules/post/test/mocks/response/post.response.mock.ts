import { MediaStatus } from '../../../../../database/models/media.model';
import { IPost, PostPrivacy, PostType } from '../../../../../database/models/post.model';
import { GroupPrivacy } from '../../../../../shared/group/dto';
import { PostResponseDto } from '../../../dto/responses';

export const mockedPostResponse: PostResponseDto = {
  ownerReactions: [],
  id: '40dc4093-1bd0-4105-869f-8504e1986141',
  content: 'bbbbbb',
  type: PostType.POST,
  media: {
    files: [],
    videos: [],
    images: [
      {
        id: 'd838659a-85ef-47ba-91e6-902aa6174142',
        name: 'filename.jpg',
        status: MediaStatus.COMPLETED,
        url: 'http://google.co',
        width: null,
        height: null,
      },
    ],
  },
  setting: {
    canReact: true,
    canComment: true,
    canShare: true,
    isImportant: false,
    importantExpiredAt: null,
  },
  isDraft: true,
  isProcessing: false,
  actor: {
    id: '7251dac7-5088-4a33-b900-d1b058edaf98',
    username: 'quannhac',
    fullname: 'Lý Quân Nhạc',
    avatar:
      'https://bein-entity-attribute-stg.s3.ap-southeast-1.amazonaws.com/user/avatar/Avatar_Profile.png',
    email: 'quannhac@tgm.vn',
  },
  mentions: {},
  commentsCount: 0,
  totalUsersSeen: 0,
  reactionsCount: {},
  markedReadPost: false,
  createdAt: new Date('2022-05-19T07:23:55.601Z'),
  updatedAt: new Date('2022-05-19T07:23:55.601Z'),
  createdBy: '7251dac7-5088-4a33-b900-d1b058edaf98',
  audience: {
    groups: [
      {
        id: '7251dac7-5088-4a33-b900-d1b058edaf99',
        name: 'EVOL Community',
        icon: 'https://bein-entity-attribute-sandbox.s3.ap-southeast-1.amazonaws.com/group/avatar/images/original/e55a5e2f-5f61-4a1b-ad3f-623f08eec1a1',
        privacy: GroupPrivacy.PUBLIC,
      },
    ],
  },
  comments: {
    list: [],
    meta: {
      limit: 10,
      offset: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  },
  privacy: PostPrivacy.PUBLIC,
};

export const mockedPostData = {
  id: 'ad70928e-cffd-44a9-9b27-19faa7210530',
  commentsCount: 3,
  isImportant: false,
  importantExpiredAt: null,
  isDraft: true,
  canComment: true,
  canReact: true,
  isProcessing: false,
  canShare: true,
  content: 'bbbbbb',
  giphyId: null,
  createdBy: '438e292f-d8a3-4777-8cd2-0b8a61fd049c',
  updatedBy: '438e292f-d8a3-4777-8cd2-0b8a61fd049c',
  createdAt: new Date('2022-05-18T11:05:11.998Z'),
  updatedAt: new Date('2022-05-19T07:19:14.130Z'),
  markedReadPost: false,
  groups: [
    {
      groupId: '09c88080-a975-44e1-ae67-89f3d37e114f',
      postId: 'ad70928e-cffd-44a9-9b27-19faa7210530',
    },
  ],
  mentions: [],
  media: [],
  ownerReactions: [
    {
      id: '69fa2be3-5d43-4edf-84d9-650ce6799b41',
      postId: 'ad70928e-cffd-44a9-9b27-19faa7210530',
      reactionName: 'bb',
      createdBy: '438e292f-d8a3-4777-8cd2-0b8a61fd049c',
      createdAt: '2022-05-18T11:05:31.990Z',
    },
  ],
  privacy: PostPrivacy.PUBLIC,
};
