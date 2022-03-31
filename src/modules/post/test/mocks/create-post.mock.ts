import { CreatePostDto } from '../../dto/requests';

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
  mentions: [
    {
      id: 1,
      username: 'abcd',
      fullname: 'abcd',
      avatar: 'asdfsdf',
      groups: [1],
    },
  ],
  audience: {
    groups: [
      {
        id: 1,
        name: 'abcd',
        icon: 'aaaa',
      },
    ],
  },
  isDraft: false,
};
