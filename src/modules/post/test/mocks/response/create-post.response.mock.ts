export const mockedCreatePostResponse = {
  ownerReactions: [],
  id: 1,
  content: 'bbbbbb',
  media: {
    files: [],
    videos: [],
    images: [
      {
        id: 1,
        name: 'filename.jpg',
        status: 'completed',
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
    id: '438e292f-d8a3-4777-8cd2-0b8a61fd049c',
    username: 'quannhac',
    fullname: 'Lý Quân Nhạc',
    avatar:
      'https://bein-entity-attribute-stg.s3.ap-southeast-1.amazonaws.com/user/avatar/Avatar_Profile.png',
    email: 'quannhac@tgm.vn',
  },
  mentions: [],
  commentsCount: 0,
  reactionsCount: {},
  markedReadPost: false,
  createdAt: '2022-05-19T07:23:55.601Z',
  updatedAt: '2022-05-19T07:23:55.601Z',
  createdBy: '438e292f-d8a3-4777-8cd2-0b8a61fd049c',
  audience: {
    groups: [
      {
        id: 1,
        name: 'EVOL Community',
        icon: 'https://bein-entity-attribute-sandbox.s3.ap-southeast-1.amazonaws.com/group/avatar/images/original/e55a5e2f-5f61-4a1b-ad3f-623f08eec1a1',
        privacy: 'PUBLIC',
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
};

export const mockedPostCreated = {
  id: 'ad70928e-cffd-44a9-9b27-19faa7210530',
  isDraft: true,
  content: 'bbbbbb',
  createdBy: '438e292f-d8a3-4777-8cd2-0b8a61fd049c',
  updatedBy: '438e292f-d8a3-4777-8cd2-0b8a61fd049c',
  isImportant: false,
  importantExpiredAt: null,
  canShare: true,
  canComment: true,
  canReact: true,
  isProcessing: false,
  updatedAt: '2022-05-19T07:31:55.504Z',
  createdAt: '2022-05-19T07:31:55.504Z',
  commentsCount: 0,
  giphyId: null,
};
