import { UpdateArticleDto } from '../../../dto/requests';

export const mockedUpdateArticleDto: UpdateArticleDto = {
  title: 'aaa',
  summary: 'ccc',
  categories: ['0afb93ac-1234-4323-b7ef-5e809bf9b722'],
  series: ['1bfb93ac-2322-4323-b7ef-5e809bf9b722'],
  hashtags: ['hashtag1'],
  audience: {
    groupIds: [2],
    userIds: [],
  },
  content: 'bbb',
  media: {
    images: [
      {
        id: 'd838659a-85ef-47ba-91e6-902aa6174142',
      },
    ],
    videos: [],
    files: [],
  },
  setting: {
    canReact: true,
    canComment: true,
    canShare: true,
    isImportant: false,
    importantExpiredAt: null,
  },
};
