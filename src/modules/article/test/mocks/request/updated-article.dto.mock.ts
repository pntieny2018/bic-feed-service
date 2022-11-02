import { UpdateArticleDto } from '../../../dto/requests';

export const mockedUpdateArticleDto: UpdateArticleDto = {
  title: 'aaa',
  summary: 'ccc',
  categories: ['0afb93ac-1234-4323-b7ef-5e809bf9b722'],
  series: ['1bfb93ac-2322-4323-b7ef-5e809bf9b722'],
  hashtags: ['hashtag1'],
  audience: {
    groupIds: ['855bedeb-b708-4e13-8c68-131d92cd79b3'],
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
  mentions: ['855bedeb-b708-4e13-8c68-131d92cd79b2'],
  coverMedia: {
    id: '855bedeb-b708-4e13-8c68-131d92cd7911',
  },
  setting: {
    canReact: true,
    canComment: true,
    canShare: true,
    isImportant: false,
    importantExpiredAt: null,
  },
};
