import { CONTENT_STATUS, PRIVACY } from '@beincom/constants';
import { TRANSFORMER_VISIBLE_ONLY } from '@libs/common/constants/transfromer.constant';
import { ArrayHelper } from '@libs/common/helpers';
import { Span } from '@libs/common/modules/opentelemetry';
import { GroupDto } from '@libs/service/group';
import { UserDto } from '@libs/service/user';
import { Inject, Injectable } from '@nestjs/common';
import { instanceToInstance } from 'class-transformer';
import { uniq, pick, map } from 'lodash';

import { EntityHelper } from '../../../../../common/helpers';
import {
  IReportDomainService,
  REPORT_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import {
  PostEntity,
  SeriesEntity,
  ArticleEntity,
  PostAttributes,
  ArticleAttributes,
} from '../../../domain/model/content';
import { LinkPreviewEntity } from '../../../domain/model/link-preview';
import { QuizParticipantEntity } from '../../../domain/model/quiz-participant';
import { TagEntity } from '../../../domain/model/tag';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IPostReactionRepository,
  IQuizParticipantRepository,
  POST_REACTION_REPOSITORY_TOKEN,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import {
  IUserAdapter,
  USER_ADAPTER,
  GROUP_ADAPTER,
  IGroupAdapter,
} from '../../../domain/service-adapter-interface';
import {
  PostDto,
  SeriesDto,
  UserMentionDto,
  ArticleDto,
  LinkPreviewDto,
  SeriesInContentDto,
  TagDto,
  PostInSeriesDto,
  ArticleInSeriesDto,
  ReportReasonCountDto,
  ItemInSeries,
  OwnerReactionDto,
  ReactionCount,
} from '../../dto';
import { IMediaBinding, MEDIA_BINDING_TOKEN } from '../binding-media';
import { IQuizBinding, QUIZ_BINDING_TOKEN } from '../binding-quiz';
import { IReportBinding, REPORT_BINDING_TOKEN } from '../binding-report';

import { IContentBinding } from './content.binding.interface';

@Injectable()
export class ContentBinding implements IContentBinding {
  public constructor(
    @Inject(QUIZ_BINDING_TOKEN)
    private readonly _quizBinding: IQuizBinding,
    @Inject(MEDIA_BINDING_TOKEN)
    private readonly _mediaBinding: IMediaBinding,
    @Inject(REPORT_BINDING_TOKEN)
    private readonly _reportBinding: IReportBinding,

    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomain: IReportDomainService,

    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _quizParticipantRepo: IQuizParticipantRepository,
    @Inject(POST_REACTION_REPOSITORY_TOKEN)
    private readonly _postReactionRepo: IPostReactionRepository,

    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter
  ) {}

  @Span()
  public async postBinding(
    postEntity: PostEntity,
    dataBinding: {
      actor?: UserDto;
      groups?: GroupDto[];
      authUser: UserDto;
    }
  ): Promise<PostDto> {
    const { authUser } = dataBinding;
    const postId = postEntity.getId();

    const [
      { actor, mentionUsers },
      { groups, communities },
      series,
      reactionsCount,
      ownerReactions,
      markedReadPosts,
    ] = await Promise.all([
      this._getUsersBindingInContent({
        authUser,
        createdBy: postEntity.getCreatedBy(),
        mentionUserIds: postEntity.get('mentionUserIds'),
        actor: dataBinding.actor,
      }),
      this._getGroupsBindingInContent({
        authUser,
        groupIds: postEntity.getGroupIds(),
        groups: dataBinding.groups,
      }),
      this._getSeriesBindingInContent(postEntity.getSeriesIds()),
      this._getReactionsCountBindingInContent(
        postId,
        postEntity.get('aggregation')?.reactionsCount
      ),
      this._bindOwnerReactions(authUser.id, [postId]),
      this._bindMarkedReadPost(authUser.id, [postId]),
    ]);

    let quiz;
    let quizHighestScore;
    let quizDoing;
    if (postEntity.get('quiz') && postEntity.get('quiz').isVisible(authUser.id)) {
      const { quizzesHighestScoreMap, quizzesDoingMap } = await this._getQuizBindingInContent(
        [postId],
        authUser
      );

      quiz = this._quizBinding.binding(postEntity.get('quiz'));
      quizHighestScore = quizzesHighestScoreMap?.get(postId)
        ? {
            quizParticipantId: quizzesHighestScoreMap.get(postId).get('id'),
            score: quizzesHighestScoreMap.get(postId).get('score'),
          }
        : undefined;
      quizDoing = quizzesDoingMap?.get(postId)
        ? { quizParticipantId: quizzesDoingMap.get(postId).get('id') }
        : undefined;
    }

    let reportReasonsCount;
    if (postEntity.isHidden() && postEntity.isOwner(authUser.id)) {
      reportReasonsCount = await this._getReportReasonsCountBindingInContent(postId);
    }

    return new PostDto({
      id: postId,
      isReported: postEntity.get('isReported'),
      isHidden: postEntity.isHidden(),
      createdBy: postEntity.getCreatedBy(),
      actor,
      privacy: postEntity.get('privacy'),
      status: postEntity.get('status'),
      type: postEntity.getType(),
      setting: postEntity.get('setting'),
      media: this._mediaBinding.binding(postEntity.get('media')),
      createdAt: postEntity.get('createdAt'),
      updatedAt: postEntity.get('updatedAt'),
      markedReadPost: markedReadPosts[postId] || false,
      ownerReactions: ownerReactions[postId] || [],
      reactionsCount,
      publishedAt: postEntity.get('publishedAt'),
      scheduledAt: postEntity.get('scheduledAt'),
      audience: { groups },
      communities,
      wordCount: postEntity.get('wordCount'),
      commentsCount: postEntity.get('aggregation')?.commentsCount || 0,
      totalUsersSeen: postEntity.get('aggregation')?.totalUsersSeen || 0,
      title: postEntity.get('title'),
      content: postEntity.get('content'),
      mentions: mentionUsers,
      linkPreview: this._getLinkPreviewBindingInContent(postEntity.get('linkPreview')),
      series,
      tags: postEntity.getTags().map((tagEntity) => this._getTagBindingInContent(tagEntity)),
      quiz,
      quizHighestScore,
      quizDoing,
      reportReasonsCount,
    });
  }

  private _postsBinding(
    postsEntities: PostEntity[],
    dataBinding: {
      authUser: UserDto;
      users: { [id: string]: UserDto };
      groups: GroupDto[];
      communities: GroupDto[];
      quizzesHighestScoreMap: Map<string, QuizParticipantEntity>;
      quizzesDoingMap: Map<string, QuizParticipantEntity>;
      ownerReactions: Record<string, OwnerReactionDto[]>;
      markedReadPosts: Record<string, boolean>;
    }
  ): PostDto[] {
    if (!postsEntities.length) {
      return [];
    }

    const { authUser, users, groups, communities, quizzesHighestScoreMap, quizzesDoingMap } =
      dataBinding;

    return postsEntities.map((postEntity) => {
      const postGroups = groups.filter((group) => postEntity.getGroupIds().includes(group.id));
      const communityIds = uniq(postGroups.map((group) => group.rootGroupId));
      const postCommunities = communities.filter((group) => communityIds.includes(group.id));
      const quizHighestScore = quizzesHighestScoreMap.get(postEntity.getId());
      const quizDoing = quizzesDoingMap.get(postEntity.getId());
      const mentionUsers = Object.values(pick(users, postEntity.get('mentionUserIds')));

      return new PostDto({
        id: postEntity.getId(),
        isReported: postEntity.get('isReported'),
        isHidden: postEntity.isHidden(),
        createdBy: postEntity.getCreatedBy(),
        actor: this._mapActorUser(users[postEntity.getCreatedBy()]),
        privacy: postEntity.get('privacy'),
        status: postEntity.get('status'),
        type: postEntity.getType(),
        setting: postEntity.get('setting'),
        media: this._mediaBinding.binding(postEntity.get('media')),
        createdAt: postEntity.get('createdAt'),
        updatedAt: postEntity.get('updatedAt'),
        markedReadPost: dataBinding.markedReadPosts[postEntity.getId()] || false,
        ownerReactions: dataBinding.ownerReactions[postEntity.getId()] || [],
        reactionsCount: map(postEntity.get('aggregation')?.reactionsCount, (value, key) => ({
          [key]: value,
        })),
        publishedAt: postEntity.get('publishedAt'),
        scheduledAt: postEntity.get('scheduledAt'),
        audience: { groups: postGroups },
        communities: postCommunities,
        wordCount: postEntity.get('wordCount'),
        commentsCount: postEntity.get('aggregation')?.commentsCount || 0,
        totalUsersSeen: postEntity.get('aggregation')?.totalUsersSeen || 0,
        content: postEntity.get('content'),
        mentions: this._mapMentionWithUserInfo(mentionUsers),
        linkPreview: this._getLinkPreviewBindingInContent(postEntity.get('linkPreview')),
        tags: postEntity.getTags().map((tagEntity) => this._getTagBindingInContent(tagEntity)),
        quiz:
          postEntity.get('quiz') && postEntity.get('quiz').isVisible(authUser.id)
            ? this._quizBinding.binding(postEntity.get('quiz'))
            : undefined,
        quizHighestScore: quizHighestScore
          ? { quizParticipantId: quizHighestScore.get('id'), score: quizHighestScore.get('score') }
          : undefined,
        quizDoing: quizDoing ? { quizParticipantId: quizDoing.get('id') } : undefined,
      });
    });
  }

  @Span()
  public async articleBinding(
    articleEntity: ArticleEntity,
    dataBinding: {
      actor?: UserDto;
      groups?: GroupDto[];
      authUser: UserDto;
    }
  ): Promise<ArticleDto> {
    const { authUser } = dataBinding;
    const articleId = articleEntity.getId();

    const [
      { actor, mentionUsers },
      { groups, communities },
      series,
      reactionsCount,
      ownerReactions,
      markedReadArticles,
    ] = await Promise.all([
      this._getUsersBindingInContent({
        authUser,
        createdBy: articleEntity.getCreatedBy(),
        actor: dataBinding.actor,
      }),
      this._getGroupsBindingInContent({
        authUser,
        groupIds: articleEntity.getGroupIds(),
        groups: dataBinding.groups,
      }),
      this._getSeriesBindingInContent(articleEntity.getSeriesIds()),
      this._getReactionsCountBindingInContent(
        articleId,
        articleEntity.get('aggregation')?.reactionsCount
      ),
      this._bindOwnerReactions(authUser.id, [articleId]),
      this._bindMarkedReadPost(authUser.id, [articleId]),
    ]);

    let quiz;
    let quizHighestScore;
    let quizDoing;
    if (articleEntity.get('quiz') && articleEntity.get('quiz').isVisible(authUser.id)) {
      const { quizzesHighestScoreMap, quizzesDoingMap } = await this._getQuizBindingInContent(
        [articleId],
        authUser
      );

      quiz = this._quizBinding.binding(articleEntity.get('quiz'));
      quizHighestScore = quizzesHighestScoreMap?.get(articleId)
        ? {
            quizParticipantId: quizzesHighestScoreMap.get(articleId).get('id'),
            score: quizzesHighestScoreMap.get(articleId).get('score'),
          }
        : undefined;
      quizDoing = quizzesDoingMap?.get(articleId)
        ? { quizParticipantId: quizzesDoingMap.get(articleId).get('id') }
        : undefined;
    }

    let reportReasonsCount;
    if (articleEntity.isHidden() && articleEntity.isOwner(authUser.id)) {
      reportReasonsCount = await this._getReportReasonsCountBindingInContent(articleId);
    }

    return new ArticleDto({
      id: articleId,
      isReported: articleEntity.get('isReported'),
      isHidden: articleEntity.isHidden(),
      createdBy: articleEntity.getCreatedBy(),
      actor,
      privacy: articleEntity.get('privacy'),
      status: articleEntity.get('status'),
      type: articleEntity.getType(),
      setting: articleEntity.get('setting'),
      createdAt: articleEntity.get('createdAt'),
      updatedAt: articleEntity.get('updatedAt'),
      markedReadPost: markedReadArticles[articleEntity.getId()] || false,
      ownerReactions: ownerReactions[articleEntity.getId()] || [],
      reactionsCount,
      publishedAt: articleEntity.isWaitingSchedule() // Temporarily set publish to backward compatible with mobile
        ? articleEntity.get('scheduledAt')
        : articleEntity.get('publishedAt'),
      scheduledAt: articleEntity.get('scheduledAt'),
      audience: { groups },
      communities,
      wordCount: articleEntity.get('wordCount'),
      commentsCount: articleEntity.get('aggregation')?.commentsCount || 0,
      totalUsersSeen: articleEntity.get('aggregation')?.totalUsersSeen || 0,
      content: articleEntity.get('content'),
      summary: articleEntity.get('summary'),
      title: articleEntity.get('title'),
      mentions: mentionUsers,
      categories: articleEntity.getCategories().map((category) => ({
        id: category.get('id'),
        name: category.get('name'),
      })),
      coverMedia: this._mediaBinding.imageBinding(articleEntity.get('cover')),
      series,
      tags: articleEntity.getTags().map((tagEntity) => this._getTagBindingInContent(tagEntity)),
      quiz,
      quizHighestScore,
      quizDoing,
      reportReasonsCount,
    });
  }

  private _articlesBinding(
    articleEntities: ArticleEntity[],
    dataBinding: {
      authUser: UserDto;
      users: { [id: string]: UserDto };
      groups: GroupDto[];
      communities: GroupDto[];
      quizzesHighestScoreMap: Map<string, QuizParticipantEntity>;
      quizzesDoingMap: Map<string, QuizParticipantEntity>;
      ownerReactions: Record<string, OwnerReactionDto[]>;
      markedReadPosts: Record<string, boolean>;
    }
  ): ArticleDto[] {
    if (!articleEntities.length) {
      return [];
    }

    const { authUser, users, groups, communities, quizzesHighestScoreMap, quizzesDoingMap } =
      dataBinding;

    return articleEntities.map((articleEntity) => {
      const articleGroups = groups.filter((group) =>
        articleEntity.getGroupIds().includes(group.id)
      );
      const communityIds = uniq(articleGroups.map((group) => group.rootGroupId));
      const articleCommunities = communities.filter((group) => communityIds.includes(group.id));
      const quizHighestScore = quizzesHighestScoreMap.get(articleEntity.getId());
      const quizDoing = quizzesDoingMap.get(articleEntity.getId());

      return new ArticleDto({
        id: articleEntity.get('id'),
        isReported: articleEntity.get('isReported'),
        isHidden: articleEntity.isHidden(),
        createdBy: articleEntity.getCreatedBy(),
        actor: this._mapActorUser(users[articleEntity.getCreatedBy()]),
        privacy: articleEntity.get('privacy'),
        status: articleEntity.get('status'),
        type: articleEntity.getType(),
        setting: articleEntity.get('setting'),
        createdAt: articleEntity.get('createdAt'),
        updatedAt: articleEntity.get('updatedAt'),
        markedReadPost: dataBinding.markedReadPosts[articleEntity.getId()] || false,
        ownerReactions: dataBinding.ownerReactions[articleEntity.getId()] || [],
        reactionsCount: map(articleEntity.get('aggregation')?.reactionsCount, (value, key) => ({
          [key]: value,
        })),
        publishedAt: articleEntity.isWaitingSchedule() // Temporarily set publish to backward compatible with mobile
          ? articleEntity.get('scheduledAt')
          : articleEntity.get('publishedAt'),
        scheduledAt: articleEntity.get('scheduledAt'),
        audience: { groups: articleGroups },
        communities: articleCommunities,
        wordCount: articleEntity.get('wordCount'),
        commentsCount: articleEntity.get('aggregation')?.commentsCount || 0,
        totalUsersSeen: articleEntity.get('aggregation')?.totalUsersSeen || 0,
        title: articleEntity.get('title'),
        summary: articleEntity.get('summary'),
        coverMedia: this._mediaBinding.imageBinding(articleEntity.get('cover')),
        tags: articleEntity.getTags().map((tagEntity) => this._getTagBindingInContent(tagEntity)),
        quiz:
          articleEntity.get('quiz') && articleEntity.get('quiz').isVisible(authUser.id)
            ? this._quizBinding.binding(articleEntity.get('quiz'))
            : undefined,
        quizHighestScore: quizHighestScore
          ? { quizParticipantId: quizHighestScore.get('id'), score: quizHighestScore.get('score') }
          : undefined,
        quizDoing: quizDoing ? { quizParticipantId: quizDoing.get('id') } : undefined,
      });
    });
  }

  @Span()
  public async seriesBinding(
    seriesEntity: SeriesEntity,
    dataBinding: {
      actor?: UserDto;
      groups?: GroupDto[];
      authUser: UserDto;
    }
  ): Promise<SeriesDto> {
    const { authUser } = dataBinding;
    const seriesId = seriesEntity.getId();

    const [{ actor }, { groups, communities }, items, markedReadSeries] = await Promise.all([
      this._getUsersBindingInContent({
        authUser,
        createdBy: seriesEntity.getCreatedBy(),
      }),
      this._getGroupsBindingInContent({
        authUser,
        groupIds: seriesEntity.getGroupIds(),
        groups: dataBinding.groups,
      }),
      this._contentRepo.findAll({
        where: {
          ids: seriesEntity.getItemIds(),
          excludeReportedByUserId: dataBinding.authUser?.id,
          isHidden: false,
          status: CONTENT_STATUS.PUBLISHED,
        },
        include: {
          shouldIncludeGroup: true,
          shouldIncludeCategory: true,
        },
      }),
      this._bindMarkedReadPost(authUser.id, [seriesId]),
    ]);

    const itemIds = seriesEntity.getItemIds();
    items.sort((a, b) => itemIds.indexOf(a.getId()) - itemIds.indexOf(b.getId()));
    const bindingItems = await this.seriesItemBinding(items as (PostEntity | ArticleEntity)[]);

    return new SeriesDto({
      id: seriesId,
      isReported: seriesEntity.get('isReported'),
      isHidden: seriesEntity.isHidden(),
      createdBy: seriesEntity.getCreatedBy(),
      actor,
      privacy: seriesEntity.get('privacy'),
      status: seriesEntity.get('status'),
      type: seriesEntity.getType(),
      setting: seriesEntity.get('setting'),
      createdAt: seriesEntity.get('createdAt'),
      updatedAt: seriesEntity.get('updatedAt'),
      markedReadPost: markedReadSeries[seriesEntity.getId()] || false,
      publishedAt: seriesEntity.get('publishedAt'),
      audience: { groups },
      communities,
      commentsCount: seriesEntity.get('aggregation')?.commentsCount || 0,
      totalUsersSeen: seriesEntity.get('aggregation')?.totalUsersSeen || 0,
      title: seriesEntity.get('title'),
      summary: seriesEntity.get('summary'),
      items: bindingItems,
      coverMedia: this._mediaBinding.imageBinding(seriesEntity.get('cover')),
    });
  }

  private _seriesBinding(
    seriesEntities: SeriesEntity[],
    dataBinding: {
      authUser: UserDto;
      users: { [id: string]: UserDto };
      groups: GroupDto[];
      communities: GroupDto[];
      markedReadPosts: Record<string, boolean>;
      items: (PostEntity | ArticleEntity)[];
    }
  ): SeriesDto[] {
    if (!seriesEntities.length) {
      return [];
    }

    const { users, groups, communities, items } = dataBinding;

    return seriesEntities.map((seriesEntity) => {
      const seriesGroups = groups.filter((group) => seriesEntity.getGroupIds().includes(group.id));
      const communityIds = uniq(seriesGroups.map((group) => group.rootGroupId));
      const seriesCommunities = communities.filter((group) => communityIds.includes(group.id));
      const itemIds = seriesEntity.getItemIds();
      const seriesItems = items
        .filter((item) => itemIds.includes(item.getId()))
        .map(
          (item) =>
            new ItemInSeries({
              id: item.getId(),
              type: item.getType(),
              title: item.getTitle(),
            })
        );
      seriesItems.sort((a, b) => itemIds.indexOf(a.id) - itemIds.indexOf(b.id));
      return new SeriesDto({
        id: seriesEntity.get('id'),
        isReported: seriesEntity.get('isReported'),
        isHidden: seriesEntity.isHidden(),
        createdBy: seriesEntity.getCreatedBy(),
        actor: this._mapActorUser(users[seriesEntity.getCreatedBy()]),
        privacy: seriesEntity.get('privacy'),
        status: seriesEntity.get('status'),
        type: seriesEntity.getType(),
        setting: seriesEntity.get('setting'),
        createdAt: seriesEntity.get('createdAt'),
        updatedAt: seriesEntity.get('updatedAt'),
        markedReadPost: dataBinding.markedReadPosts[seriesEntity.getId()] || false,
        publishedAt: seriesEntity.get('publishedAt'),
        audience: { groups: seriesGroups },
        communities: seriesCommunities,
        commentsCount: seriesEntity.get('aggregation')?.commentsCount || 0,
        totalUsersSeen: seriesEntity.get('aggregation')?.totalUsersSeen || 0,
        title: seriesEntity.get('title'),
        summary: seriesEntity.get('summary'),
        items: seriesItems,
        coverMedia: this._mediaBinding.imageBinding(seriesEntity.get('cover')),
      });
    });
  }

  @Span()
  public async seriesItemBinding(
    items: (PostEntity | ArticleEntity)[]
  ): Promise<(PostInSeriesDto | ArticleInSeriesDto)[]> {
    const userIds = items.map((item) => item.getCreatedBy());
    const groupIds = items.map((item) => item.getGroupIds()).flat();

    const [users, groups] = await Promise.all([
      this._userAdapter.getUsersByIds(uniq(userIds)),
      this._groupAdapter.getGroupsByIds(uniq(groupIds)),
    ]);

    return items.map((item) => {
      if (item instanceof PostEntity) {
        return {
          id: item.getId(),
          title: item.getTitle(),
          createdBy: item.getCreatedBy(),
          createdAt: item.get('createdAt'),
          publishedAt: item.get('publishedAt'),
          setting: item.get('setting'),
          type: item.getType(),
          actor: users.find((user) => user.id === item.getCreatedBy()),
          media: this._mediaBinding.binding(item.get('media')),
          audience: {
            groups: groups.filter((group) => item.getGroupIds().includes(group.id)),
          },
        };
      }

      return {
        id: item.getId(),
        title: item.getTitle(),
        summary: item.get('summary'),
        type: item.get('type'),
        createdBy: item.getCreatedBy(),
        createdAt: item.get('createdAt'),
        publishedAt: item.get('publishedAt'),
        setting: item.get('setting'),
        actor: users.find((user) => user.id === item.getCreatedBy()),
        coverMedia: this._mediaBinding.imageBinding(item.get('cover')),
        categories: (item.get('categories') || []).map((category) => ({
          id: category.get('id'),
          name: category.get('name'),
        })),
        audience: {
          groups: groups.filter((group) => item.getGroupIds().includes(group.id)),
        },
      };
    });
  }

  @Span()
  public async contentsBinding(
    contentEntities: (PostEntity | ArticleEntity | SeriesEntity)[],
    authUser: UserDto
  ): Promise<(PostDto | ArticleDto | SeriesDto)[]> {
    if (!contentEntities.length) {
      return [];
    }

    const contentIds = [];
    const authorIds = [];
    const mentionUserIds = [];
    const groupIds = [];
    const seriesItemIds = [];
    const postEntities = [];
    const articleEntities = [];
    const seriesEntities = [];
    let hasBindingQuiz = false;

    for (const contentEntity of contentEntities) {
      contentIds.push(contentEntity.getId());
      authorIds.push(contentEntity.getCreatedBy());
      groupIds.push(...contentEntity.getGroupIds());
      if (contentEntity instanceof PostEntity) {
        postEntities.push(contentEntity);
        mentionUserIds.push(...contentEntity.get('mentionUserIds'));
      }
      if (contentEntity instanceof ArticleEntity) {
        articleEntities.push(contentEntity);
      }
      if (contentEntity instanceof SeriesEntity) {
        seriesEntities.push(contentEntity);
        seriesItemIds.push(...contentEntity.getItemIds());
      }
      if (
        !hasBindingQuiz &&
        contentEntity.getQuiz() &&
        contentEntity.getQuiz().isVisible(authUser.id)
      ) {
        hasBindingQuiz = true;
      }
    }

    const [users, groups, ownerReactions, markedReadPosts] = await Promise.all([
      this._userAdapter.getUsersByIds(uniq([...authorIds, ...mentionUserIds])),
      this._groupAdapter.getGroupsByIds(uniq(groupIds)),
      this._bindOwnerReactions(authUser.id, contentIds),
      this._bindMarkedReadPost(authUser.id, contentIds),
    ]);

    const usersMap = ArrayHelper.convertArrayToObject(users, 'id');

    const accessGroups = this._filterSecretGroupCannotAccess(groups, authUser);
    const communityIds = uniq(accessGroups.map((group) => group.rootGroupId));
    const communities = await this._groupAdapter.getGroupsByIds(communityIds);

    let quizzesHighestScoreMap = new Map();
    let quizzesDoingMap = new Map();
    if (hasBindingQuiz) {
      const quizBinding = await this._getQuizBindingInContent(contentIds, authUser);
      quizzesHighestScoreMap = quizBinding.quizzesHighestScoreMap;
      quizzesDoingMap = quizBinding.quizzesDoingMap;
    }

    let seriesItems = [];
    if (seriesItemIds.length) {
      seriesItems = await this._contentRepo.findAll({
        where: {
          ids: seriesItemIds,
          excludeReportedByUserId: authUser?.id,
          isHidden: false,
          status: CONTENT_STATUS.PUBLISHED,
        },
        select: ['id', 'type', 'title'],
      });
    }

    const dataBinding = {
      authUser,
      groups,
      communities,
      users: usersMap,
      quizzesDoingMap,
      quizzesHighestScoreMap,
      ownerReactions,
      markedReadPosts,
    };

    const postsMap = ArrayHelper.convertArrayToObject(
      this._postsBinding(postEntities, dataBinding),
      'id'
    );
    const articlesMap = ArrayHelper.convertArrayToObject(
      this._articlesBinding(articleEntities, dataBinding),
      'id'
    );
    const series = ArrayHelper.convertArrayToObject(
      this._seriesBinding(seriesEntities, { ...dataBinding, items: seriesItems }),
      'id'
    );

    return contentEntities.map((contentEntity) => {
      if (contentEntity instanceof PostEntity) {
        return postsMap[contentEntity.getId()];
      }
      if (contentEntity instanceof ArticleEntity) {
        return articlesMap[contentEntity.getId()];
      }
      return series[contentEntity.getId()];
    });
  }

  private _mapMentionWithUserInfo(users: UserDto[]): UserMentionDto {
    if (!users || !users?.length) {
      return {};
    }
    return users
      .filter((user) => user)
      .reduce((returnValue, current) => {
        return {
          ...returnValue,
          [current.username]: {
            id: current.id,
            fullname: current.fullname,
            username: current.username,
            avatar: current.avatar,
          },
        };
      }, {});
  }

  private _filterSecretGroupCannotAccess(groups: GroupDto[], authUser?: UserDto): GroupDto[] {
    return groups.filter((group) => {
      const isUserNotInGroup = !(authUser?.groups || []).includes(group.id);
      const isGuest = !authUser;
      return !(group.privacy === PRIVACY.SECRET && (isUserNotInGroup || isGuest));
    });
  }

  private _getLinkPreviewBindingInContent(linkPreviewEntity: LinkPreviewEntity): LinkPreviewDto {
    if (!linkPreviewEntity) {
      return null;
    }
    return {
      id: linkPreviewEntity.get('id'),
      url: linkPreviewEntity.get('url'),
      domain: linkPreviewEntity.get('domain'),
      image: linkPreviewEntity.get('image'),
      title: linkPreviewEntity.get('title'),
      description: linkPreviewEntity.get('description'),
    };
  }

  private async _getSeriesBindingInContent(
    seriesIds: string[] = []
  ): Promise<SeriesInContentDto[]> {
    if (!seriesIds.length) {
      return [];
    }

    const series = (await this._contentRepo.findAll({
      attributes: {
        exclude: ['content'],
      },
      where: {
        groupArchived: false,
        isHidden: false,
        ids: seriesIds,
      },
    })) as SeriesEntity[];

    return series.map((seriesEntity) => ({
      id: seriesEntity.get('id'),
      title: seriesEntity.get('title'),
      createdBy: seriesEntity.get('createdBy'),
    }));
  }

  private _getTagBindingInContent(tagEntity: TagEntity): TagDto {
    if (!tagEntity) {
      return null;
    }
    return {
      id: tagEntity.get('id'),
      groupId: tagEntity.get('groupId'),
      name: tagEntity.get('name'),
    };
  }

  private async _getUsersBindingInContent(data: {
    authUser: UserDto;
    createdBy: string;
    mentionUserIds?: string[];
    actor?: UserDto;
  }): Promise<{ users: UserDto[]; actor: UserDto; mentionUsers: UserMentionDto }> {
    const { createdBy, mentionUserIds = [], actor } = data;

    const userIdsNeedToFind = [];

    if (!actor) {
      userIdsNeedToFind.push(createdBy);
    }
    if (mentionUserIds.length) {
      userIdsNeedToFind.push(...mentionUserIds);
    }

    const users = await this._userAdapter.getUsersByIds(uniq(userIdsNeedToFind));

    if (actor) {
      users.push(actor);
    }

    const actorBinding = users.find((user) => user.id === createdBy);

    let mentionUsersBinding: UserMentionDto = {};
    if (mentionUserIds && users.length) {
      mentionUsersBinding = this._mapMentionWithUserInfo(
        users.filter((user) => mentionUserIds.includes(user.id))
      );
    }

    return { users, actor: actorBinding, mentionUsers: mentionUsersBinding };
  }

  private async _getGroupsBindingInContent(data: {
    authUser: UserDto;
    groupIds?: string[];
    groups?: GroupDto[];
  }): Promise<{ groups: GroupDto[]; communities: GroupDto[] }> {
    const { authUser, groupIds = [], groups } = data;

    const bindingGroups = groups || (await this._groupAdapter.getGroupsByIds(groupIds));
    const accessGroups = this._filterSecretGroupCannotAccess(bindingGroups, authUser);

    const communityIds = ArrayHelper.arrayUnique(accessGroups.map((group) => group.rootGroupId));
    const communities = await this._groupAdapter.getGroupsByIds(communityIds);

    return { groups: accessGroups, communities };
  }

  private async _getQuizBindingInContent(
    contentIds: string[],
    authUser: UserDto
  ): Promise<{
    quizzesHighestScoreMap: Map<string, QuizParticipantEntity>;
    quizzesDoingMap: Map<string, QuizParticipantEntity>;
  }> {
    if (!authUser) {
      return { quizzesHighestScoreMap: null, quizzesDoingMap: null };
    }

    const [quizzesHighestScore, quizzesDoing] = await Promise.all([
      this._quizParticipantRepo.findQuizParticipantHighestScoreByContentIdsAndUserId(
        contentIds,
        authUser.id
      ),
      this._quizParticipantRepo.findQuizParticipantDoingByContentIdsAndUserId(
        contentIds,
        authUser.id
      ),
    ]);

    const quizzesHighestScoreMap = EntityHelper.entityArrayToMap(quizzesHighestScore, 'contentId');
    const quizzesDoingMap = EntityHelper.entityArrayToMap(quizzesDoing, 'contentId');

    return { quizzesHighestScoreMap, quizzesDoingMap };
  }

  private async _getReactionsCountBindingInContent(
    contentId: string,
    entityReactionCount?: ReactionCount
  ): Promise<ReactionCount[]> {
    if (entityReactionCount) {
      return map(entityReactionCount, (value, key) => ({ [key]: value }));
    }

    const reactionsCountMap = await this._postReactionRepo.getAndCountReactionByContents([
      contentId,
    ]);
    return reactionsCountMap.get(contentId) || [];
  }

  private async _getReportReasonsCountBindingInContent(
    contentId: string
  ): Promise<ReportReasonCountDto[]> {
    const reasonsCount = await this._reportDomain.countReportReasonsByTargetId(contentId);
    return this._reportBinding.bindingReportReasonsCount(reasonsCount);
  }

  @Span()
  public async postAttributesBinding(
    postAttributes: PostAttributes,
    dataBinding: {
      actor?: UserDto;
      groups?: GroupDto[];
      authUser: UserDto;
    }
  ): Promise<PostDto> {
    const { authUser } = dataBinding;
    const postId = postAttributes.id;

    const [{ actor, mentionUsers }, { groups, communities }, series, reactionsCount] =
      await Promise.all([
        this._getUsersBindingInContent({
          authUser,
          createdBy: postAttributes.createdBy,
          mentionUserIds: postAttributes.mentionUserIds,
          actor: dataBinding.actor,
        }),
        this._getGroupsBindingInContent({
          authUser,
          groupIds: postAttributes.groupIds,
          groups: dataBinding.groups,
        }),
        this._getSeriesBindingInContent(postAttributes.seriesIds),
        this._getReactionsCountBindingInContent(postId, postAttributes.aggregation?.reactionsCount),
      ]);

    let quiz;
    let quizHighestScore;
    let quizDoing;
    if (postAttributes.quiz && postAttributes.quiz.isVisible(authUser.id)) {
      const { quizzesHighestScoreMap, quizzesDoingMap } = await this._getQuizBindingInContent(
        [postId],
        authUser
      );

      quiz = this._quizBinding.binding(postAttributes.quiz);
      quizHighestScore = quizzesHighestScoreMap?.get(postId)
        ? {
            quizParticipantId: quizzesHighestScoreMap.get(postId).get('id'),
            score: quizzesHighestScoreMap.get(postId).get('score'),
          }
        : undefined;
      quizDoing = quizzesDoingMap?.get(postId)
        ? { quizParticipantId: quizzesDoingMap.get(postId).get('id') }
        : undefined;
    }

    return new PostDto({
      id: postId,
      isReported: postAttributes.isReported,
      isHidden: postAttributes.isHidden,
      createdBy: postAttributes.createdBy,
      actor,
      privacy: postAttributes.privacy,
      status: postAttributes.status,
      type: postAttributes.type,
      setting: postAttributes.setting,
      media: this._mediaBinding.binding(postAttributes.media),
      createdAt: postAttributes.createdAt,
      updatedAt: postAttributes.updatedAt,
      markedReadPost: postAttributes.markedReadImportant,
      ownerReactions: postAttributes.ownerReactions,
      reactionsCount,
      publishedAt: postAttributes.publishedAt,
      scheduledAt: postAttributes.scheduledAt,
      audience: { groups },
      communities,
      wordCount: postAttributes.wordCount,
      commentsCount: postAttributes.aggregation?.commentsCount || 0,
      totalUsersSeen: postAttributes.aggregation?.totalUsersSeen || 0,
      content: postAttributes.content,
      mentions: mentionUsers,
      linkPreview: this._getLinkPreviewBindingInContent(postAttributes.linkPreview),
      series,
      tags: postAttributes.tags.map((tagEntity) => this._getTagBindingInContent(tagEntity)),
      quiz,
      quizHighestScore,
      quizDoing,
    });
  }

  @Span()
  public async articleAttributesBinding(
    articleAttributes: ArticleAttributes,
    dataBinding: {
      actor?: UserDto;
      groups?: GroupDto[];
      authUser: UserDto;
    }
  ): Promise<ArticleDto> {
    const { authUser } = dataBinding;
    const articleId = articleAttributes.id;

    const [{ actor, mentionUsers }, { groups, communities }, series, reactionsCount] =
      await Promise.all([
        this._getUsersBindingInContent({
          authUser,
          createdBy: articleAttributes.createdBy,
          actor: dataBinding.actor,
        }),
        this._getGroupsBindingInContent({
          authUser,
          groupIds: articleAttributes.groupIds,
          groups: dataBinding.groups,
        }),
        this._getSeriesBindingInContent(articleAttributes.seriesIds),
        this._getReactionsCountBindingInContent(
          articleId,
          articleAttributes.aggregation?.reactionsCount
        ),
      ]);

    let quiz;
    let quizHighestScore;
    let quizDoing;
    if (articleAttributes.quiz && articleAttributes.quiz.isVisible(authUser.id)) {
      const { quizzesHighestScoreMap, quizzesDoingMap } = await this._getQuizBindingInContent(
        [articleId],
        authUser
      );

      quiz = this._quizBinding.binding(articleAttributes.quiz);
      quizHighestScore = quizzesDoingMap?.get(articleId)
        ? {
            quizParticipantId: quizzesHighestScoreMap.get(articleId).get('id'),
            score: quizzesHighestScoreMap.get(articleId).get('score'),
          }
        : undefined;
      quizDoing = quizzesDoingMap?.get(articleId)
        ? { quizParticipantId: quizzesDoingMap.get(articleId).get('id') }
        : undefined;
    }

    return new ArticleDto({
      id: articleAttributes.id,
      isReported: articleAttributes.isReported,
      isHidden: articleAttributes.isHidden,
      createdBy: articleAttributes.createdBy,
      actor,
      privacy: articleAttributes.privacy,
      status: articleAttributes.status,
      type: articleAttributes.type,
      setting: articleAttributes.setting,
      createdAt: articleAttributes.createdAt,
      updatedAt: articleAttributes.updatedAt,
      markedReadPost: articleAttributes.markedReadImportant,
      ownerReactions: articleAttributes.ownerReactions,
      reactionsCount,
      publishedAt:
        articleAttributes.status === CONTENT_STATUS.WAITING_SCHEDULE // Temporarily set publish to backward compatible with mobile
          ? articleAttributes.scheduledAt
          : articleAttributes.publishedAt,
      scheduledAt: articleAttributes.scheduledAt,
      audience: { groups },
      communities,
      wordCount: articleAttributes.wordCount,
      commentsCount: articleAttributes.aggregation?.commentsCount || 0,
      totalUsersSeen: articleAttributes.aggregation?.totalUsersSeen || 0,
      content: articleAttributes.content,
      summary: articleAttributes.summary,
      title: articleAttributes.title,
      mentions: mentionUsers,
      categories: (articleAttributes.categories || []).map((category) => ({
        id: category.get('id'),
        name: category.get('name'),
      })),
      coverMedia: this._mediaBinding.imageBinding(articleAttributes.cover),
      series,
      tags: (articleAttributes.tags || []).map((tagEntity) =>
        this._getTagBindingInContent(tagEntity)
      ),
      quiz,
      quizHighestScore,
      quizDoing,
    });
  }

  private _mapActorUser(user: UserDto): UserDto {
    return instanceToInstance(user, { groups: [TRANSFORMER_VISIBLE_ONLY.PUBLIC] });
  }

  private _bindOwnerReactions(
    authUserId: string,
    contentIds: string[]
  ): Promise<Record<string, OwnerReactionDto[]>> {
    return this._postReactionRepo.getReactionsByContents(contentIds, authUserId);
  }

  private _bindMarkedReadPost(
    authUserId: string,
    contentIds: string[]
  ): Promise<Record<string, boolean>> {
    return this._contentRepo.getMarkReadImportant(contentIds, authUserId);
  }
}
