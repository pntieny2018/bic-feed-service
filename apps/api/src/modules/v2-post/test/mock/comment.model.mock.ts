import { IComment } from 'apps/api/src/database/models/comment.model';
import { userMock } from './user.dto.mock';
import { postRecordMock } from './post.model.mock';
import { v4 } from 'uuid';

export const commentRecord: IComment = {
  id: v4(),
  content: 'This is a comment',
  postId: 'ff09eb67-3319-4c0a-9e15-04cf14358ae7',
  parentId: '00000000-0000-0000-0000-000000000000',
  isHidden: false,
  updatedBy: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
  createdBy: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
  giphyId: 'EZICHGrSD5QEFCxMiC',
  mediaJson: {
    files: [{ id: '95809c73-e73e-4c49-855a-67ff0ca58346' }],
    images: [{ id: '95809c73-e73e-4c49-855a-67ff0ca58346' }],
    videos: [{ id: '95809c73-e73e-4c49-855a-67ff0ca58346' }],
  },
  mentions: ['0fa01fde-7c15-4d55-b60a-8e990123bc2e'],
  updatedAt: new Date(),
  createdAt: new Date(),
  totalReply: 0,
  edited: false,
  actor: userMock,
  post: postRecordMock,
};

export const commentMock = {
  edited: false,
  total_reply: 39,
  id: '7a821691-64cb-4846-9933-d31cbe5ce558',
  parent_id: '00000000-0000-0000-0000-000000000000',
  post_id: 'b114b2dd-39b4-43ae-8643-c9e3228feeb5',
  content: '1',
  giphy_id: '',
  giphy_url: null,
  created_at: '2022-09-30T03:07:57.216Z',
  created_by: '6235bc91-2255-4f4b-bcfa-bebcd24e27ac',
  updated_at: '2022-09-30T06:18:30.616Z',
  actor: {
    id: '6235bc91-2255-4f4b-bcfa-bebcd24e27ac',
    username: 'bic',
    fullname: 'beincom',
    email: 'beincom@evol.vn',
    avatar:
      'https://media.beincom.io/image/variants/user/avatar/8d7b4502-0c6f-4d5c-a4b5-9efde7d58699',
    is_deactivated: false,
    is_verified: true,
    showing_badges: [],
  },
  media: {
    files: [],
    images: [],
    videos: [],
  },
  owner_reactions: [],
  reactions_count: [],
  mentions: {},
};
