import { CONTENT_STATUS, PRIVACY } from '@beincom/constants';
import { ArrayHelper } from '@libs/common/helpers';
import { GroupDto } from '@libs/service/group';
import { UserDto } from '@libs/service/user';
import { Inject, Injectable } from '@nestjs/common';
import { uniq } from 'lodash';

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
  IReportRepository,
  POST_REACTION_REPOSITORY_TOKEN,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
  REPORT_REPOSITORY_TOKEN,
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
} from '../../dto';
import { IMediaBinding, MEDIA_BINDING_TOKEN } from '../binding-media';
import { IQuizBinding, QUIZ_BINDING_TOKEN } from '../binding-quiz';

import { IContentBinding } from './content.interface';

@Injectable()
export class ContentBinding implements IContentBinding {
  public constructor(
    @Inject(QUIZ_BINDING_TOKEN)
    private readonly _quizBinding: IQuizBinding,
    @Inject(MEDIA_BINDING_TOKEN)
    private readonly _mediaBinding: IMediaBinding,

    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomain: IReportDomainService,

    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _quizParticipantRepo: IQuizParticipantRepository,
    @Inject(POST_REACTION_REPOSITORY_TOKEN)
    private readonly _postReactionRepo: IPostReactionRepository,
    @Inject(REPORT_REPOSITORY_TOKEN)
    private readonly _reportRepo: IReportRepository,

    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter
  ) {}
  public async postBinding(
    postEntity: PostEntity,
    dataBinding: {
      actor?: UserDto;
      mentionUsers?: UserDto[];
      groups?: GroupDto[];
      authUser: UserDto;
    }
  ): Promise<PostDto> {
    const { authUser } = dataBinding;

    const { actor, mentionUsers } = await this._getUsersBindingInContent({
      authUser,
      createdBy: postEntity.getCreatedBy(),
      mentionUserIds: postEntity.get('mentionUserIds'),
      actor: dataBinding.actor,
      mentionUsers: dataBinding.mentionUsers,
    });

    const { groups, communities } = await this._getGroupsBindingInContent({
      authUser,
      groupIds: postEntity.getGroupIds(),
      groups: dataBinding.groups,
    });

    const series = await this._getSeriesBindingInContent(postEntity.getSeriesIds());

    const { quizHighestScore, quizDoing } = await this._getQuizBindingInContent(
      postEntity.getId(),
      authUser
    );

    const reactionsCount = await this._postReactionRepo.getAndCountReactionByContents([
      postEntity.getId(),
    ]);

    let reportReasonCounts;
    if (postEntity.isHidden() && postEntity.isOwner(authUser.id)) {
      reportReasonCounts = await this._getReportReasonCountsBindingInContent(postEntity.getId());
    }

    return new PostDto({
      id: postEntity.getId(),
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
      markedReadPost: postEntity.get('markedReadImportant'),
      isSaved: postEntity.get('isSaved'),
      ownerReactions: postEntity.get('ownerReactions'),
      reactionsCount: reactionsCount.get(postEntity.getId()) || [],
      publishedAt: postEntity.get('publishedAt'),
      scheduledAt: postEntity.get('scheduledAt'),
      audience: { groups },
      communities,
      wordCount: postEntity.get('wordCount'),
      commentsCount: postEntity.get('aggregation')?.commentsCount || 0,
      totalUsersSeen: postEntity.get('aggregation')?.totalUsersSeen || 0,
      content: postEntity.get('content'),
      mentions: mentionUsers,
      linkPreview: this._getLinkPreviewBindingInContent(postEntity.get('linkPreview')),
      series,
      tags: postEntity.getTags().map((tagEntity) => this._getTagBindingInContent(tagEntity)),
      quiz:
        postEntity.get('quiz') && postEntity.get('quiz').isVisible(authUser.id)
          ? this._quizBinding.binding(postEntity.get('quiz'))
          : undefined,
      quizHighestScore: quizHighestScore
        ? { quizParticipantId: quizHighestScore.get('id'), score: quizHighestScore.get('score') }
        : undefined,
      quizDoing: quizDoing ? { quizParticipantId: quizDoing.get('id') } : undefined,
      reportReasonCounts,
    });
  }

  public async articleBinding(
    articleEntity: ArticleEntity,
    dataBinding: {
      actor?: UserDto;
      groups?: GroupDto[];
      authUser: UserDto;
    }
  ): Promise<ArticleDto> {
    const { authUser } = dataBinding;

    const { actor, mentionUsers } = await this._getUsersBindingInContent({
      authUser,
      createdBy: articleEntity.getCreatedBy(),
      actor: dataBinding.actor,
    });

    const { groups, communities } = await this._getGroupsBindingInContent({
      authUser,
      groupIds: articleEntity.getGroupIds(),
      groups: dataBinding.groups,
    });

    const series = await this._getSeriesBindingInContent(articleEntity.getSeriesIds());

    const reactionsCount = await this._postReactionRepo.getAndCountReactionByContents([
      articleEntity.getId(),
    ]);

    const { quizHighestScore, quizDoing } = await this._getQuizBindingInContent(
      articleEntity.getId(),
      authUser
    );

    let reportReasonCounts;
    if (articleEntity.isHidden() && articleEntity.isOwner(authUser.id)) {
      reportReasonCounts = await this._getReportReasonCountsBindingInContent(articleEntity.getId());
    }

    return new ArticleDto({
      id: articleEntity.get('id'),
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
      markedReadPost: articleEntity.get('markedReadImportant'),
      isSaved: articleEntity.get('isSaved'),
      ownerReactions: articleEntity.get('ownerReactions'),
      reactionsCount: reactionsCount.get(articleEntity.getId()) || [],
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
      quiz:
        articleEntity.get('quiz') && articleEntity.get('quiz').isVisible(authUser.id)
          ? this._quizBinding.binding(articleEntity.get('quiz'))
          : undefined,
      quizHighestScore: quizHighestScore
        ? { quizParticipantId: quizHighestScore.get('id'), score: quizHighestScore.get('score') }
        : undefined,
      quizDoing: quizDoing ? { quizParticipantId: quizDoing.get('id') } : undefined,
      reportReasonCounts,
    });
  }

  public async seriesBinding(
    seriesEntity: SeriesEntity,
    dataBinding: {
      actor?: UserDto;
      groups?: GroupDto[];
      authUser: UserDto;
    }
  ): Promise<SeriesDto> {
    const { authUser } = dataBinding;

    const { actor } = await this._getUsersBindingInContent({
      authUser,
      createdBy: seriesEntity.getCreatedBy(),
    });

    const { groups, communities } = await this._getGroupsBindingInContent({
      authUser,
      groupIds: seriesEntity.getGroupIds(),
      groups: dataBinding.groups,
    });

    const itemIds = seriesEntity.getItemIds();
    const items = (await this._contentRepo.findAll({
      where: {
        ids: itemIds,
        excludeReportedByUserId: dataBinding.authUser?.id,
        isHidden: false,
        status: CONTENT_STATUS.PUBLISHED,
      },
      include: {
        shouldIncludeCategory: true,
        shouldIncludeQuiz: true,
        shouldIncludeGroup: true,
      },
    })) as (PostEntity | ArticleEntity)[];
    items.sort((a, b) => itemIds.indexOf(a.getId()) - itemIds.indexOf(b.getId()));

    const bindingItems = await this.seriesItemBinding(items);

    return new SeriesDto({
      id: seriesEntity.get('id'),
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
      markedReadPost: seriesEntity.get('markedReadImportant'),
      isSaved: seriesEntity.get('isSaved'),
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

  public async seriesItemBinding(
    items: (PostEntity | ArticleEntity)[]
  ): Promise<(PostInSeriesDto | ArticleInSeriesDto)[]> {
    const userIds = items.map((item) => item.getCreatedBy());
    const users = await this._userAdapter.getUsersByIds(uniq(userIds));

    const groupIds = items.map((item) => item.getGroupIds()).flat();
    const groups = await this._groupAdapter.getGroupsByIds(uniq(groupIds));

    return items.map((item) => {
      if (item instanceof PostEntity) {
        return {
          id: item.getId(),
          content: item.get('content'),
          createdBy: item.getCreatedBy(),
          createdAt: item.get('createdAt'),
          publishedAt: item.get('publishedAt'),
          setting: item.get('setting'),
          type: item.getType(),
          actor: users.find((user) => user.id === item.getCreatedBy()),
          isSaved: item.get('isSaved'),
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
        isSaved: item.get('isSaved'),
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

  public async contentsBinding(
    contentEntities: (PostEntity | ArticleEntity | SeriesEntity)[],
    authUser: UserDto
  ): Promise<(PostDto | ArticleDto | SeriesDto)[]> {
    if (!contentEntities.length) {
      return [];
    }

    const result = [];
    for (const contentEntity of contentEntities) {
      if (contentEntity instanceof PostEntity) {
        const postDto = await this.postBinding(contentEntity, { authUser });
        result.push(postDto);
      }
      if (contentEntity instanceof ArticleEntity) {
        const articleDto = await this.articleBinding(contentEntity, { authUser });
        result.push(articleDto);
      }
      if (contentEntity instanceof SeriesEntity) {
        const seriesDto = await this.seriesBinding(contentEntity, { authUser });
        result.push(seriesDto);
      }
    }

    return result;
  }

  public mapMentionWithUserInfo(users: UserDto[]): UserMentionDto {
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
            email: current.email,
            username: current.username,
            avatar: current.avatar,
          },
        };
      }, {});
  }

  public filterSecretGroupCannotAccess(groups: GroupDto[], authUser?: UserDto): GroupDto[] {
    return groups.filter((group) => {
      const isUserNotInGroup = !authUser?.groups.includes(group.id);
      const isGuest = !authUser;
      return !(group.privacy === PRIVACY.SECRET && (isUserNotInGroup || isGuest));
    });
  }

  private _getLinkPreviewBindingInContent(linkPreviewEntity: LinkPreviewEntity): LinkPreviewDto {
    if (!linkPreviewEntity) {
      return null;
    }
    return {
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
    mentionUsers?: UserDto[];
  }): Promise<{ users: UserDto[]; actor: UserDto; mentionUsers: UserMentionDto }> {
    const { authUser, createdBy, mentionUserIds = [], actor, mentionUsers } = data;

    const userIdsNeedToFind = [];

    if (!actor) {
      userIdsNeedToFind.push(createdBy);
    }
    if (mentionUserIds.length && !mentionUsers) {
      userIdsNeedToFind.push(...mentionUserIds);
    }

    const users = await this._userAdapter.findAllAndFilterByPersonalVisibility(
      uniq(userIdsNeedToFind),
      authUser.id
    );

    if (actor) {
      users.push(actor);
    }
    if (mentionUsers) {
      users.push(...mentionUsers);
    }

    const actorBinding = users.find((user) => user.id === createdBy);

    let mentionUsersBinding: UserMentionDto = {};
    if (mentionUserIds && users.length) {
      mentionUsersBinding = this.mapMentionWithUserInfo(
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
    const accessGroups = this.filterSecretGroupCannotAccess(bindingGroups, authUser);

    const communityIds = ArrayHelper.arrayUnique(accessGroups.map((group) => group.rootGroupId));
    const communities = await this._groupAdapter.getGroupsByIds(communityIds);

    return { groups: accessGroups, communities };
  }

  private async _getQuizBindingInContent(
    contentId: string,
    authUser: UserDto
  ): Promise<{ quizHighestScore: QuizParticipantEntity; quizDoing: QuizParticipantEntity }> {
    if (!authUser) {
      return { quizHighestScore: null, quizDoing: null };
    }

    const quizHighestScore =
      await this._quizParticipantRepo.findQuizParticipantHighestScoreByContentIdAndUserId(
        contentId,
        authUser.id
      );
    const quizDoing = await this._quizParticipantRepo.findQuizParticipantDoingByContentIdAndUserId(
      contentId,
      authUser.id
    );

    return { quizHighestScore, quizDoing };
  }

  private async _getReportReasonCountsBindingInContent(
    contentId: string
  ): Promise<ReportReasonCountDto[]> {
    const reportDetails = await this._reportRepo.findReportDetails({
      where: { targetId: contentId },
    });
    return this._reportDomain.countReportReasons(reportDetails);
  }

  public async postAttributesBinding(
    postAttributes: PostAttributes,
    dataBinding: {
      actor?: UserDto;
      mentionUsers?: UserDto[];
      groups?: GroupDto[];
      authUser: UserDto;
    }
  ): Promise<PostDto> {
    const { authUser } = dataBinding;

    const { actor, mentionUsers } = await this._getUsersBindingInContent({
      authUser,
      createdBy: postAttributes.createdBy,
      mentionUserIds: postAttributes.mentionUserIds,
      actor: dataBinding.actor,
      mentionUsers: dataBinding.mentionUsers,
    });

    const { groups, communities } = await this._getGroupsBindingInContent({
      authUser,
      groupIds: postAttributes.groupIds,
      groups: dataBinding.groups,
    });

    const series = await this._getSeriesBindingInContent(postAttributes.seriesIds);

    const { quizHighestScore, quizDoing } = await this._getQuizBindingInContent(
      postAttributes.id,
      authUser
    );

    const reactionsCount = await this._postReactionRepo.getAndCountReactionByContents([
      postAttributes.id,
    ]);

    return new PostDto({
      id: postAttributes.id,
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
      isSaved: postAttributes.isSaved,
      ownerReactions: postAttributes.ownerReactions,
      reactionsCount: reactionsCount.get(postAttributes.id) || [],
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
      quiz:
        postAttributes.quiz && postAttributes.quiz.isVisible(authUser.id)
          ? this._quizBinding.binding(postAttributes.quiz)
          : undefined,
      quizHighestScore: quizHighestScore
        ? { quizParticipantId: quizHighestScore.get('id'), score: quizHighestScore.get('score') }
        : undefined,
      quizDoing: quizDoing ? { quizParticipantId: quizDoing.get('id') } : undefined,
    });
  }

  public async articleAttributesBinding(
    articleAttributes: ArticleAttributes,
    dataBinding: {
      actor?: UserDto;
      groups?: GroupDto[];
      authUser: UserDto;
    }
  ): Promise<ArticleDto> {
    const { authUser } = dataBinding;

    const { actor, mentionUsers } = await this._getUsersBindingInContent({
      authUser,
      createdBy: articleAttributes.createdBy,
      actor: dataBinding.actor,
    });

    const { groups, communities } = await this._getGroupsBindingInContent({
      authUser,
      groupIds: articleAttributes.groupIds,
      groups: dataBinding.groups,
    });

    const series = await this._getSeriesBindingInContent(articleAttributes.seriesIds);

    const reactionsCount = await this._postReactionRepo.getAndCountReactionByContents([
      articleAttributes.id,
    ]);

    const { quizHighestScore, quizDoing } = await this._getQuizBindingInContent(
      articleAttributes.id,
      authUser
    );

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
      isSaved: articleAttributes.isSaved,
      ownerReactions: articleAttributes.ownerReactions,
      reactionsCount: reactionsCount.get(articleAttributes.id) || [],
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
      quiz:
        articleAttributes.quiz && articleAttributes.quiz.isVisible(authUser.id)
          ? this._quizBinding.binding(articleAttributes.quiz)
          : undefined,
      quizHighestScore: quizHighestScore
        ? { quizParticipantId: quizHighestScore.get('id'), score: quizHighestScore.get('score') }
        : undefined,
      quizDoing: quizDoing ? { quizParticipantId: quizDoing.get('id') } : undefined,
    });
  }
}
