import { MentionableType } from './../../../../common/constants/model.constant';
export const mockedPostList = [
  {
    id: 1,
    createdBy: 1,
    updatedBy: 1,
    isImportant: true,
    commentsCount: 0,
    importantExpiredAt: new Date(),
    canShare: true,
    canReact: true,
    canComment: true,
    content: 'aaaa',
    isDraft: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    groups: [
      {
        groupId: 1,
        postId: 1,
      },
    ],
    mentions: [
      {
        userId: 1,
        entityId: 1,
        mentionableType: MentionableType.POST,
      },
    ],
  },
];
