export const mockedPostResponse = {
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
        uploadId: null,
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
    id: 15,
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
  createdBy: 15,
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

export const mockedPostData = {
  id: 3,
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
  createdBy: 15,
  updatedBy: 15,
  createdAt: '2022-05-18T11:05:11.998Z',
  updatedAt: '2022-05-19T07:19:14.130Z',
  markedReadPost: false,
  groups: [
    {
      groupId: 1,
    },
  ],
  mentions: [],
  media: [],
  ownerReactions: [
    {
      id: 2,
      postId: 3,
      reactionName: 'bb',
      createdBy: 15,
      createdAt: '2022-05-18T11:05:31.990Z',
    },
  ],
};
