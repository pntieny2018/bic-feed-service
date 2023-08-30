import { IPost } from '../../../../database/models/post.model';
import { PostPrivacy, PostStatus, PostType } from '../../data-type';

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
  coverJson: {
    height: 298,
    id: '0ff17730-07c6-4d3e-8104-57af6c79d5cb',
    mime_type: 'image/jpeg',
    url: 'https://media.beincom.app/image/variants/post/content/0ff17730-07c6-4d3e-8104-57af6c79d5cb',
    width: 166,
  },
};
