import { CreateArticleDto } from "../../../dto/requests";

export const mockedCreateArticleDto: CreateArticleDto = {
  categories: [
    {
      id: '111-aaa',
      name: 'Technical',
    },
  ],
  series: [{
    {
      id: '111-ss',
      name: 'Serial 1',
    },
  }],
  hashtags: ['sfddsf'],
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
