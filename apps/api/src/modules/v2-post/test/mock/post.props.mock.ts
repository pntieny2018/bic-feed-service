import { PostPrivacy, PostType } from '../../data-type';
import { PostStatus } from '../../data-type/post-status.enum';
import { PostProps } from '../../domain/model/content';

export const postProps: PostProps = {
  id: '9bacb01c-deae-4d80-81d7-b619b26ef684',
  isReported: false,
  isHidden: false,
  createdBy: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
  updatedBy: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
  privacy: PostPrivacy.PRIVATE,
  status: PostStatus.DRAFT,
  type: PostType.POST,
  createdAt: new Date(),
  updatedAt: new Date(),
  setting: {
    isImportant: false,
    importantExpiredAt: null,
    canComment: true,
    canReact: true,
  },
  content: 'This is a post',
  mentionUserIds: [],
  groupIds: ['b01fb58e-9299-4a0e-a55f-9839293fb42a', 'a29bfb75-4d07-4f7c-9bb1-e1fdffead4ec'],
  media: {
    files: [],
    images: [],
    videos: [],
  },
  seriesIds: [],
  tags: [],
};
