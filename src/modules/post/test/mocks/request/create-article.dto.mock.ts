import { CreatePostDto } from '../../../dto/requests';
import { CreateArticleDto } from '../../../dto/requests/create-article.dto';

export const mockedCreateArticleDto: CreateArticleDto = {
  categories: ['aaa'],
  series: ['aaaa'],
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
