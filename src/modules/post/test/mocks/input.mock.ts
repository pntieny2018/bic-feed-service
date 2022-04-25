import { UserDto } from '../../../auth';

export const mockUserDto: UserDto = {
  id: 33,
};

export const mockElasticsearchSearchPostEditedHistoryIndex = {
  body: {
    hits: {
      hits: [
        {
          ['_source']: {
            postId: 110,
            content: 'I love typescript...',
            media: {
              videos: [],
              images: [],
              files: [],
            },
            editedAt: '2022-04-25T10:48:14.021Z',
          },
        },
        {
          ['_source']: {
            postId: 110,
            content: 'I love nodejs 2...',
            media: {
              videos: [],
              images: [],
              files: [],
            },
            editedAt: '2022-04-25T09:47:38.634Z',
          },
        },
        {
          ['_source']: {
            postId: 110,
            content: 'I love nodejs...',
            media: {
              videos: [],
              images: [],
              files: [],
            },
            editedAt: '2022-04-25T09:44:11.512Z',
          },
        },
      ],
    },
  },
};
