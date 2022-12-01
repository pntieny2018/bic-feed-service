export const ELASTIC_POST_MAPPING_PATH = {
  categories: {
    id: 'categories.id',
    name: 'categories.name',
  },
  articles: {
    id: 'articles.id',
    zindex: 'articles.zindex',
  },
  groupIds: 'groupIds',
  title: {
    text: {
      default: 'title.text.default',
      ascii: 'title.text.ascii',
    },
  },
  summary: {
    text: {
      default: 'summary.text.default',
      ascii: 'summary.text.ascii',
    },
  },
  content: {
    language: 'content.language',
    text: {
      default: 'content.text.default',
      ascii: 'content.text.ascii',
    },
  },
  id: 'id',
  type: 'type',
  createdAt: 'createdAt',
  createdBy: 'createdBy',
  media: 'media',
  mentions: 'mentions',
};
