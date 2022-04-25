import { PageDto } from '../../../../../common/dto';
import { PostEditedHistoryDto } from '../../../dto/responses';

export const mockGetPostEditedHistoryResult: PageDto<PostEditedHistoryDto> = {
  list: [
    {
      postId: 110,
      content: 'I love typescript...',
      media: {
        videos: [],
        images: [],
        files: [],
      },
      editedAt: '2022-04-25T10:48:14.021Z',
    },
    {
      postId: 110,
      content: 'I love nodejs 2...',
      media: {
        videos: [],
        images: [],
        files: [],
      },
      editedAt: '2022-04-25T09:47:38.634Z',
    },
    {
      postId: 110,
      content: 'I love nodejs...',
      media: {
        videos: [],
        images: [],
        files: [],
      },
      editedAt: '2022-04-25T09:44:11.512Z',
    },
  ],
  meta: {
    limit: 10,
  },
};
