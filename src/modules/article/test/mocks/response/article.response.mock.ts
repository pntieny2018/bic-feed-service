import { MediaStatus } from '../../../../../database/models/media.model';
import { PostPrivacy, PostStatus, PostType } from '../../../../../database/models/post.model';
import { GroupPrivacy } from '../../../../../shared/group/dto';
import { ArticleResponseDto } from '../../../dto/responses';

export const mockedArticleResponse: ArticleResponseDto = {
  ownerReactions: [],
  title: 'aaa',
  summary: 'bbb',
  id: '40dc4093-1bd0-4105-869f-8504e1986141',
  content: 'bbbbbb',
  type: PostType.ARTICLE,
  isLocked: true,
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
  status: PostStatus.DRAFT,
  actor: {
    id: '855bedeb-b708-4e13-8c68-131d92cd79b2',
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
  createdBy: '855bedeb-b708-4e13-8c68-131d92cd79b2',
  audience: {
    groups: [
      {
        id: '855bedeb-b708-4e13-8c68-131d92cd79b3',
        name: 'EVOL Community',
        icon: 'https://bein-entity-attribute-sandbox.s3.ap-southeast-1.amazonaws.com/group/avatar/images/original/e55a5e2f-5f61-4a1b-ad3f-623f08eec1a1',
        privacy: GroupPrivacy.OPEN,
        rootGroupId: '855bedeb-b708-4e13-8c68-131d92cd7911',
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
  categories: [
    {
      id: 'aaa',
      name: 'Technical',
    },
  ],
  series: [
    {
      id: 'aaa',
      title: 'Technical',
    },
  ],
  hashtags: [
    {
      id: 'h1',
      slug: 'h1',
      name: '#Vietnam',
    },
  ],
  privacy: PostPrivacy.OPEN,
  tags: [
    {
      id: 'h1',
      slug: 'h1',
      name: '#Vietnam',
      groupId: '855bedeb-b708-4e13-8c68-131d92cd7911',
      totalUsed: 0,
    },
  ],
  views: 0,
};

export const mockedArticleData = {
  id: 'ad70928e-cffd-44a9-9b27-19faa7210530',
  commentsCount: 3,
  type: PostType.ARTICLE,
  isImportant: false,
  importantExpiredAt: null,
  status: PostStatus.DRAFT,
  canComment: true,
  canReact: true,
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
      groupId: '838ca621-e37d-414b-babf-4efc6ac2b5aa',
      postId: 'ad70928e-cffd-44a9-9b27-19faa7210530',
    },
  ],
  mentions: [],
  media: [],
  ownerReactions: [
    {
      id: 2,
      postId: 'ad70928e-cffd-44a9-9b27-19faa7210530',
      reactionName: 'bb',
      createdBy: '438e292f-d8a3-4777-8cd2-0b8a61fd049c',
      createdAt: '2022-05-18T11:05:31.990Z',
    },
  ],
};
