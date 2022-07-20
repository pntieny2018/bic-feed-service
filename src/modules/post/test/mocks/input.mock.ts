import { MediaStatus, MediaType } from '../../../../database/models/media.model';
import { GroupPrivacy } from '../../../../shared/group/dto';
import { UserDto } from '../../../auth';
import { VideoProcessStatus } from '../../post.constants';

export const mockUserDto: UserDto = {
  id: '7251dac7-5088-4a33-b900-d1b058edaf98',
};

export const mockIPost = {
  id: 'b9c3ca9c-e893-4f7c-b483-1c95c5c4ec47',
  createdBy: mockUserDto.id,
  content: 'haha how are you',
  groups: [
    {
      postId: 'b9c3ca9c-e893-4f7c-b483-1c95c5c4ec47',
      groupId: '7251dac7-5088-4a33-b900-d1b058edaf98',
    },
    {
      postId: 'b9c3ca9c-e893-4f7c-b483-1c95c5c4ec47',
      groupId: '7251dac7-5088-4a33-b900-d1b058edaf99',
    },
    {
      postId: 'b9c3ca9c-e893-4f7c-b483-1c95c5c4ec47',
      groupId: '7251dac7-5088-4a33-b900-d1b058edaf90',
    },
  ],
};

export const mockPostEditedHistoryModelArr = [
  {
    toJSON: () => ({
      newData: {
        id: '7673eeea-8b75-4dc6-acba-fa5d5b9d32a0',
        content: 'have videos',
        updatedAt: '2022-04-26T09:20:42.646Z',
        media: [
          {
            id: 2,
            url: 'http://google.com',
            type: 'video',
            isDraft: true,
            createdBy: 3,
            name: 'a file',
            width: null,
            height: null,
            extension: null,
            PostEditedHistoryMediaModel: { postEditedHistoryId: 11, mediaId: 2 },
          },
        ],
      },
    }),
  },
  {
    toJSON: () => ({
      newData: {
        id: '7673eeea-8b75-4dc6-acba-fa5d5b9d32a0',
        content: 'image...',
        updatedAt: '2022-04-26T09:20:23.252Z',
        media: [
          {
            id: 1,
            url: 'http://google.com',
            type: 'image',
            isDraft: true,
            createdBy: 3,
            name: 'an image',
            width: null,
            height: null,
            extension: null,
            PostEditedHistoryMediaModel: { postEditedHistoryId: 10, mediaId: 1 },
          },
        ],
      },
    }),
  },
];

export const mockedGroups = [
  {
    id: 1,
    name: 'Name of group',
    icon: 'icon link',
    privacy: GroupPrivacy.PUBLIC,
    child: {
      public: [],
      open: [],
      private: [],
      secret: [],
    },
  },
];

export const mockMediaModelArray = [
  {
    id: 'd838659a-85ef-47ba-91e6-902aa6174142',
    createdBy: 1,
    url: 'http://google.co',
    type: MediaType.IMAGE,
    isDraft: false,
    name: 'filename.jpg',
    status: MediaStatus.COMPLETED,
  },
];

export const mockProcessVideoResponseDto = {
  videoId: '85e62698-9d06-4358-93a2-fa4aa79e27b2',
  status: VideoProcessStatus.DONE,
  hlsUrl: 'http://google.com/videos/1',
};
