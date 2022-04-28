import { PageDto } from '../../../../../common/dto';
import { PostEditedHistoryDto } from '../../../dto/responses';

export const mockGetPostEditedHistoryResult: PageDto<PostEditedHistoryDto> = {
  list: [
    {
      postId: 7,
      content: 'have videos',
      media: {
        files: [],
        videos: [
          {
            id: 2,
            name: 'a file',
            url: 'http://google.com',
            originName: null,
          },
        ],
        images: [],
      },
      editedAt: '2022-04-26T09:20:42.646Z',
    },
    {
      postId: 7,
      content: 'image...',
      media: {
        files: [],
        videos: [],
        images: [
          {
            id: 1,
            name: 'an image',
            url: 'http://google.com',
            originName: null,
            width: null,
            height: null,
          },
        ],
      },
      editedAt: '2022-04-26T09:20:23.252Z',
    },
  ],
  meta: {
    limit: 25,
    total: 2,
  },
};
