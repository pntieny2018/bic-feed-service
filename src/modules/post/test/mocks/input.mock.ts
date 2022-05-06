import { IPost } from '../../../../database/models/post.model';
import { UserDto } from '../../../auth';

export const mockUserDto: UserDto = {
  id: 33,
};

export const mockPostFindOne: IPost = {
  id: 100,
  createdBy: mockUserDto.id,
  content: 'haha how are you',
  groups: [
    {
      postId: 100,
      groupId: 1,
    },
    {
      postId: 100,
      groupId: 2,
    },
    {
      postId: 100,
      groupId: 3,
    },
  ],
} as IPost;

export const mockPostEditedHistoryFindAndCountAll = [
  {
    toJSON: () => ({
      id: 11,
      postId: 7,
      content: 'have videos',
      editedAt: '2022-04-26T09:20:42.646Z',
      media: [
        {
          id: 2,
          url: 'http://google.com',
          type: 'video',
          isDraft: true,
          createdBy: 3,
          name: 'a file',
          originName: null,
          width: null,
          height: null,
          extension: null,
          PostEditedHistoryMediaModel: { postEditedHistoryId: 11, mediaId: 2 },
        },
      ],
    }),
  },
  {
    toJSON: () => ({
      id: 10,
      postId: 7,
      content: 'image...',
      editedAt: '2022-04-26T09:20:23.252Z',
      media: [
        {
          id: 1,
          url: 'http://google.com',
          type: 'image',
          isDraft: true,
          createdBy: 3,
          name: 'an image',
          originName: null,
          width: null,
          height: null,
          extension: null,
          PostEditedHistoryMediaModel: { postEditedHistoryId: 10, mediaId: 1 },
        },
      ],
    }),
  },
];
