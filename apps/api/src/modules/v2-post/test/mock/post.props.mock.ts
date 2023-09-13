import { CONTENT_STATUS, CONTENT_TYPE, PRIVACY } from '@beincom/constants';

import { PostAttributes } from '../../domain/model/content';

export const postProps: PostAttributes = {
  id: '9bacb01c-deae-4d80-81d7-b619b26ef684',
  isReported: false,
  isHidden: false,
  createdBy: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
  updatedBy: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
  privacy: PRIVACY.PRIVATE,
  status: CONTENT_STATUS.DRAFT,
  type: CONTENT_TYPE.POST,
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
