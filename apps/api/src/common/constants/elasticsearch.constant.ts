export const ELASTIC_POST_MAPPING_PATH = {
  categories: {
    id: 'categories.id',
    name: 'categories.name',
  },
  tags: {
    id: 'tags.id',
    name: 'tags.name',
    groupId: 'tags.groupId',
  },
  itemIds: 'itemsIds',
  seriesIds: 'seriesIds',
  groupIds: 'groupIds',
  communityIds: 'communityIds',
  title: {
    default: 'title.default',
    ascii: 'title.ascii',
  },
  summary: {
    default: 'summary.default',
    ascii: 'summary.ascii',
  },
  content: {
    default: 'content.default',
    ascii: 'content.ascii',
  },
  id: 'id',
  type: 'type',
  createdAt: 'createdAt',
  createdBy: 'createdBy',
  publishedAt: 'publishedAt',
  media: 'media',
  coverMedia: 'coverMedia',
  linkPreview: 'linkPreview',
  mentionUserIds: 'mentionUserIds',
};
