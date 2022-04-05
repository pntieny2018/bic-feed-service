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
  profile: {
    id: 33,
    avatar: 'aaa',
    username: 'aaa',
    fullname: 'bbb',
    groups: [1, 2],
  },
};

export const mockPostModelFindAndCountAll = [
  {
    id: 1,
    createdBy: 1,
    updatedBy: 1,
    isImportant: true,
    commentsCount: 0,
    importantExpiredAt: new Date(),
    canShare: true,
    canReact: true,
    canComment: true,
    content: 'aaaa',
    isDraft: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    groups: [
      {
        groupId: 1,
        postId: 1,
      },
    ],
    mentions: [
      {
        userId: 1,
        entityId: 1,
        mentionableType: MentionableType.POST,
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
