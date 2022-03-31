import { UpdatePostDto } from '../../dto/requests/update-post.dto';

export const mockedUpdatePostDto: UpdatePostDto = {
  content: 'aaaa',
  media: {
    files: [],
    images: [],
    videos: [],
  },
  setting: {
    canReact: false,
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
