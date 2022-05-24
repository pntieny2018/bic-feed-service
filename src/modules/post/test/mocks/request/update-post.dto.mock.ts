import { UpdatePostDto } from '../../../dto/requests';

export const mockedUpdatePostDto: UpdatePostDto = {
  audience: {
    groupIds: [2],
    userIds: [],
  },
  content: 'bbb',
  media: {
    images: [
      {
        id: 1,
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
