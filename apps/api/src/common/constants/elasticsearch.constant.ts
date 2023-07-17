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
  items: {
    id: 'items.id',
    zindex: 'items.zindex',
  },
  seriesIds: 'seriesIds',
  groupIds: 'groupIds',
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
  media: 'media',
  coverMedia: 'coverMedia',
  linkPreview: 'linkPreview',
  mentionUserIds: 'mentionUserIds',
};
