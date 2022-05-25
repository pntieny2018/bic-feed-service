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
        id: 1,
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
