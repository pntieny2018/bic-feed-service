import { CreateCommentProps, UpdateCommentProps } from '../../domain/domain-service/interface';
import { userMock } from './user.dto.mock';

export const createCommentProps: CreateCommentProps = {
  userId: '6235bc91-2255-4f4b-bcfa-bebcd24e27ac',
  postId: '9bacb01c-deae-4d80-81d7-b619b26ef684',
  parentId: '00000000-0000-0000-0000-000000000000',
  content: 'This is a comment',
  giphyId: 'EZICHGrSD5QEFCxMiC',
  media: {
    files: [],
    images: ['95809c73-e73e-4c49-855a-67ff0ca58346'],
    videos: [],
  },
  mentions: ['0fa01fde-7c15-4d55-b60a-8e990123bc2e'],
};

export const updateCommentProps: UpdateCommentProps = {
  id: 'ff09eb67-3319-4c0a-9e15-04cf14358ae7',
  postId: '9bacb01c-deae-4d80-81d7-b619b26ef684',
  content: 'This is a updated comment',
  media: {
    files: [],
    images: ['95809c73-e73e-4c49-855a-67ff0ca58346'],
    videos: [],
  },
  mentions: [],
  giphyId: 'ACICHGrSD5QEFC',
  userId: userMock.id,
};

export const notChangedCommentProps: UpdateCommentProps = {
  id: 'ff09eb67-3319-4c0a-9e15-04cf14358ae7',
  postId: '9bacb01c-deae-4d80-81d7-b619b26ef684',
  content: 'This is a comment',
  mentions: ['0fa01fde-7c15-4d55-b60a-8e990123bc2e'],
  giphyId: 'EZICHGrSD5QEFCxMiC',
  userId: userMock.id,
};
