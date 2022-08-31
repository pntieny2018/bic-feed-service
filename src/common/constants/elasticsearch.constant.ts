export const ELASTIC_POST_MAPPING_PATH = {
  actor: {
    id: 'actor.id',
    email: 'actor.email',
    fullname: 'actor.fullname',
    groups: 'actor.groups',
    username: 'actor.username',
  },
  audience: {
    groups: {
      id: 'audience.groups.id',
      child: 'audience.groups.child',
      icon: 'audience.groups.icon',
      isCommunity: 'audience.groups.isCommunity',
      name: 'audience.groups.name',
      privacy: 'audience.groups.privacy',
      communityId: 'audience.groups.communityId',
    },
  },
  commentsCount: 'commentsCount',
  totalUsersSeen: 'totalUsersSeen',
  content: {
    language: 'content.language',
    text: {
      default: 'content.text.default',
      ascii: 'content.text.ascii',
    },
  },
  id: 'id',
  isArticle: 'isArticle',
  createdAt: 'createdAt',
  media: 'media',
  mentions: 'mentions',
  setting: {
    canComment: 'setting.canComment',
    canReact: 'setting.canReact',
    canShare: 'setting.canShare',
    importantExpiredAt: 'setting.importantExpiredAt',
    isImportant: 'setting.isImportant',
  },
};
