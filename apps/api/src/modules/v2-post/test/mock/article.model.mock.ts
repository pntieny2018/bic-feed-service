import { PostPrivacy, PostStatus, PostType } from '../../data-type';
import { IPost } from '../../../../database/models/post.model';

export const postRecordMock: IPost = {
  id: 'ff09eb67-3319-4c0a-9e15-04cf14358ae7',
  groups: [
    {
      groupId: 'e22e09b2-7956-483a-ab46-87db8a74c09d',
      postId: 'ff09eb67-3319-4c0a-9e15-04cf14358ae7',
    },
  ],
  content: '1111',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: '7b63852c-5249-499a-a32b-6bdaa2761fc2',
  updatedBy: '7b63852c-5249-499a-a32b-6bdaa2761fc2',
  tags: [],
  mediaJson: {
    files: [],
    images: [],
    videos: [],
  },
  mentions: [],
  status: PostStatus.PUBLISHED,
  type: PostType.POST,
  privacy: PostPrivacy.OPEN,
  canComment: true,
  canReact: true,
  importantExpiredAt: null,
  isImportant: false,
  commentsCount: 3,
  totalUsersSeen: 14,
};
