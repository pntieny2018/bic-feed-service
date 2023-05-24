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
  updatedBy: '6235bc91-2255-4f4b-bcfa-bebcd24e27ac',
  createdBy: '6235bc91-2255-4f4b-bcfa-bebcd24e27ac',
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
