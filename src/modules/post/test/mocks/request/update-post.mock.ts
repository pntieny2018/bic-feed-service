import { UpdatePostDto } from '../../../dto/requests/update-post.dto';

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
  mentions: [1],
  audience: {
    groupIds: [1],
  },
};
