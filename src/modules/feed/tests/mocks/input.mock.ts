import { MentionableType } from '../../../../common/constants';
import { UserDto } from '../../../auth';
import { GetTimelineDto } from '../../dto/request';
import { FeedRanking } from '../../feed.enum';

export const mockGetTimeLineDto: GetTimelineDto = {
  groupId: 1,
  offset: 0,
  limit: 25,
  ranking: FeedRanking.IMPORTANT,
};

export const mockUserDto: UserDto = {
  id: 33,
};

export const mockPostModelFindAndCountAll = [
  {
    id: 3,
    isImportant: false,
    importantExpiredAt: new Date('2024-03-21T19:07:29.322Z'),
    isDraft: false,
    canComment: true,
    canReact: true,
    canShare: true,
    content: 'content 2 ...',
    createdBy: 33,
    updatedBy: 5,
    createdAt: new Date('2022-03-21T20:11:46.887Z'),
    updatedAt: new Date('2022-03-21T10:48:49.040Z'),
    reactionsCount: '1huhu,love=1,3',
    commentsCount: '3',
    isNowImportant: 1,
    belongToGroup: [{ groupId: 1, postId: 3 }],
    userNewsFeeds: [{ userId: 33, postId: 3 }],
    audienceGroup: [{ groupId: 1, postId: 3 }],
    media: [
      {
        id: 26,
        url: 'https://google.com',
        type: 'file',
        isDraft: true,
        createdBy: 1,
        name: 'x3.pdf',
        originName: null,
        width: null,
        height: null,
        extension: null,
        createdAt: new Date('2022-03-21T10:48:49.033Z'),
      },
      {
        id: 33,
        url: 'https://google.com',
        type: 'file',
        isDraft: true,
        createdBy: 1,
        name: 'x10.pdf',
        originName: null,
        width: null,
        height: null,
        extension: null,
        createdAt: new Date('2022-03-21T10:48:49.033Z'),
      },
    ],
    mentions: [],
    ownerReactions: [],
  },
  {
    id: 1,
    isImportant: false,
    importantExpiredAt: new Date('2025-03-21T09:54:53.703Z'),
    isDraft: false,
    canComment: true,
    canReact: true,
    canShare: true,
    content: 'content 0 ...',
    createdBy: 7,
    updatedBy: 5,
    createdAt: new Date('2022-03-21T17:57:24.641Z'),
    updatedAt: new Date('2022-03-21T10:48:49.040Z'),
    reactionsCount: '1care,smile,hate=1,1,1',
    commentsCount: '2',
    isNowImportant: 1,
    belongToGroup: [{ groupId: 1, postId: 1 }],
    userNewsFeeds: [{ userId: 33, postId: 1 }],
    audienceGroup: [
      { groupId: 1, postId: 1 },
      { groupId: 8, postId: 1 },
      { groupId: 10, postId: 1 },
    ],
    media: [
      {
        id: 2,
        url: 'https://google.com',
        type: 'image',
        isDraft: true,
        createdBy: 1,
        name: 'x1.png',
        originName: null,
        width: null,
        height: null,
        extension: null,
        createdAt: new Date('2022-03-21T10:48:49.033Z'),
      },
      {
        id: 13,
        url: 'https://google.com',
        type: 'video',
        isDraft: true,
        createdBy: 1,
        name: 'x1.mp4',
        originName: null,
        width: null,
        height: null,
        extension: null,
        createdAt: new Date('2022-03-21T10:48:49.033Z'),
      },
    ],
    mentions: [
      { id: 2, mentionableType: MentionableType.POST, entityId: 1, userId: 2 },
      { id: 7, mentionableType: MentionableType.POST, entityId: 1, userId: 33 },
      { id: 9, mentionableType: MentionableType.POST, entityId: 1, userId: 1 },
      { id: 10, mentionableType: MentionableType.POST, entityId: 1, userId: 33 },
    ],
    ownerReactions: [
      {
        id: 19,
        postId: 1,
        reactionName: 'hate',
        createdBy: 33,
        createdAt: new Date('2022-03-21T16:10:32.140Z'),
      },
    ],
  },
  {
    id: 5,
    isImportant: false,
    importantExpiredAt: null,
    isDraft: false,
    canComment: true,
    canReact: true,
    canShare: true,
    content: 'content 4 ...',
    createdBy: 1,
    updatedBy: 3,
    createdAt: new Date('2022-03-21T20:44:08.649Z'),
    updatedAt: new Date('2022-03-21T10:48:49.040Z'),
    reactionsCount: '1care,smile,huhu=1,1,1',
    commentsCount: '1',
    isNowImportant: 0,
    belongToGroup: [{ groupId: 1, postId: 5 }],
    userNewsFeeds: [{ userId: 33, postId: 5 }],
    audienceGroup: [{ groupId: 1, postId: 5 }],
    media: [
      {
        id: 20,
        url: 'https://google.com',
        type: 'video',
        isDraft: true,
        createdBy: 1,
        name: 'x8.mp4',
        originName: null,
        width: null,
        height: null,
        extension: null,
        createdAt: new Date('2022-03-21T10:48:49.033Z'),
      },
      {
        id: 26,
        url: 'https://google.com',
        type: 'file',
        isDraft: true,
        createdBy: 1,
        name: 'x3.pdf',
        originName: null,
        width: null,
        height: null,
        extension: null,
        createdAt: new Date('2022-03-21T10:48:49.033Z'),
      },
    ],
    mentions: [
      { id: 3, mentionableType: MentionableType.POST, entityId: 5, userId: 33 },
      { id: 4, mentionableType: MentionableType.POST, entityId: 5, userId: 2 },
    ],
    ownerReactions: [
      {
        id: 5,
        postId: 5,
        reactionName: 'care',
        createdBy: 33,
        createdAt: new Date('2022-03-21T10:48:49.060Z'),
      },
    ],
  },
  {
    id: 4,
    isImportant: false,
    importantExpiredAt: null,
    isDraft: false,
    canComment: true,
    canReact: true,
    canShare: true,
    content: 'content 3 ...',
    createdBy: 7,
    updatedBy: 7,
    createdAt: new Date('2022-03-21T16:05:01.849Z'),
    updatedAt: new Date('2022-03-21T10:48:49.040Z'),
    reactionsCount: '1angry,hate,care=1,2,1',
    commentsCount: '3',
    isNowImportant: 0,
    belongToGroup: [{ groupId: 1, postId: 4 }],
    userNewsFeeds: [{ userId: 33, postId: 4 }],
    audienceGroup: [{ groupId: 1, postId: 4 }],
    media: [
      {
        id: 30,
        url: 'https://google.com',
        type: 'file',
        isDraft: true,
        createdBy: 1,
        name: 'x7.pdf',
        originName: null,
        width: null,
        height: null,
        extension: null,
        createdAt: new Date('2022-03-21T10:48:49.033Z'),
      },
    ],
    mentions: [
      { id: 1, mentionableType: MentionableType.POST, entityId: 4, userId: 1 },
      { id: 6, mentionableType: MentionableType.POST, entityId: 4, userId: 33 },
      { id: 8, mentionableType: MentionableType.POST, entityId: 4, userId: 2 },
    ],
    ownerReactions: [
      {
        id: 20,
        postId: 4,
        reactionName: 'care',
        createdBy: 33,
        createdAt: new Date('2022-03-21T16:10:43.066Z'),
      },
    ],
  },
  {
    id: 2,
    isImportant: false,
    importantExpiredAt: new Date('2000-03-21T18:34:21.237Z'),
    isDraft: false,
    canComment: true,
    canReact: true,
    canShare: true,
    content: 'content 1 ...',
    createdBy: 2,
    updatedBy: 3,
    createdAt: new Date('1020-03-21T17:47:55.022Z'),
    updatedAt: new Date('2022-03-21T10:48:49.040Z'),
    reactionsCount: '1smile,love=1,3',
    commentsCount: '1',
    isNowImportant: 0,
    belongToGroup: [{ groupId: 1, postId: 2 }],
    userNewsFeeds: [{ userId: 33, postId: 2 }],
    audienceGroup: [
      { groupId: 1, postId: 2 },
      { groupId: 9, postId: 2 },
    ],
    media: [
      {
        id: 3,
        url: 'https://google.com',
        type: 'image',
        isDraft: true,
        createdBy: 1,
        name: 'x2.png',
        originName: null,
        width: null,
        height: null,
        extension: null,
        createdAt: new Date('2022-03-21T10:48:49.033Z'),
      },
    ],
    mentions: [{ id: 5, mentionableType: MentionableType.POST, entityId: 2, userId: 1 }],
    ownerReactions: [
      {
        id: 18,
        postId: 2,
        reactionName: 'love',
        createdBy: 33,
        createdAt: new Date('2022-03-21T16:10:20.274Z'),
      },
    ],
  },
];

export const mockUserServiceGetManyResult = [
  {
    id: 33,
    username: 'username33',
    fullname: 'User Name 33',
    avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
    groups: [1, 2, 9, 10],
  },
  {
    id: 7,
    username: 'username7',
    fullname: 'User Name 7',
    avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
    groups: [1, 2, 9, 10, 20],
  },
  {
    id: 2,
    username: 'username2',
    fullname: 'User Name 2',
    avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
    groups: [1, 2],
  },
  {
    id: 1,
    username: 'username1',
    fullname: 'User Name 1',
    avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
    groups: [1, 2],
  },
];
