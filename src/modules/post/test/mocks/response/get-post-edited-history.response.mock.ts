import { PageDto } from '../../../../../common/dto';
import { PostEditedHistoryDto } from '../../../dto/responses';

export const mockedGetPostEditedHistoryResult: PageDto<PostEditedHistoryDto> = {
  list: [
    {
      postId: '7673eeea-8b75-4dc6-acba-fa5d5b9d32a0',
      content: 'have videos',
      media: {
        files: [],
        videos: [
          {
            id: '04c75d50-8116-47ca-942c-bb807ce1147d',
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
      postId: '7673eeea-8b75-4dc6-acba-fa5d5b9d32a0',
      content: 'image...',
      media: {
        files: [],
        videos: [],
        images: [
          {
            id: '531c16fc-58e3-4280-bc99-2ec147813029',
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
