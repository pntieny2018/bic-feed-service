import { CreateArticleDto } from '../../../dto/requests';

export const mockedCreateArticleDto: CreateArticleDto = {
  categories: ['0afb93ac-1234-4323-b7ef-5e809bf9b722'],
  series: ['1bfb93ac-2322-4323-b7ef-5e809bf9b722'],
  hashtags: ['hashtag1'],
  title: 'aaa',
  summary: 'bbbb',
  audience: {
    groupIds: [1],
    userIds: [],
  },
  content: 'bbbbbb',
  media: {
    images: [
      {
        id: '9afb93ac-a150-4323-b7ef-5e809bf9b722',
      },
    ],
    videos: [],
    files: [],
  },
  mentions: [],
  setting: {
    canReact: true,
    canComment: true,
    canShare: true,
    isImportant: false,
    importantExpiredAt: null,
  },
};
