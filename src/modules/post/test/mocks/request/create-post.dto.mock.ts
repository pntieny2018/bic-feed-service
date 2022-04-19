import { CreatePostDto } from '../../../dto/requests';

export const mockedCreatePostDto: CreatePostDto = {
  content: 'aaaa',
  media: {
    files: [
      {
        id: 1,
      },
    ],
    images: [],
    videos: [],
  },
  setting: {
    canReact: true,
    canComment: true,
    canShare: true,
    isImportant: false,
    importantExpiredAt: null,
  },
  mentions: [1, 2],
  audience: {
    userIds: [],
    groupIds: [1],
  },
  isDraft: true,
};
