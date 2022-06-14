import { CreatePostDto } from '../../../dto/requests';

export const mockedCreatePostDto: CreatePostDto = {
  audience: {
    groupIds: [1],
    userIds: [],
  },
  content: 'bbbbbb',
  media: {
    images: [
      {
        id: 'd838659a-85ef-47ba-91e6-902aa6174142',
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
