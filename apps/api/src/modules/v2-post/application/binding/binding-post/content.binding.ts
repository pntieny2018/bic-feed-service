import { CONTENT_STATUS, PRIVACY } from '@beincom/constants';
import { GroupDto } from '@libs/service/group/src/group.dto';
import { UserDto } from '@libs/service/user';
import { Inject, Injectable } from '@nestjs/common';
import { uniq } from 'lodash';

import { ArrayHelper } from '../../../../../common/helpers';
import { PostEntity, SeriesEntity, ArticleEntity } from '../../../domain/model/content';
import { QuizParticipantEntity } from '../../../domain/model/quiz-participant';
import {
  IReactionQuery,
  REACTION_QUERY_TOKEN,
  ReactionsCount,
} from '../../../domain/query-interface/reaction.query.interface';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import {
  IQuizParticipantRepository,
  QUIZ_PARTICIPANT_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/quiz-participant.repository.interface';
import { IUserAdapter, USER_ADAPTER } from '../../../domain/service-adapter-interface ';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
} from '../../../domain/service-adapter-interface /group-adapter.interface';
import {
  FileDto,
  ImageDto,
  PostDto,
  QuizDto,
  SeriesDto,
  UserMentionDto,
  VideoDto,
  ArticleDto,
} from '../../dto';

import { IContentBinding } from './content.interface';

@Injectable()
export class ContentBinding implements IContentBinding {
  public constructor(
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,
    @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepo: IContentRepository,
    @Inject(QUIZ_PARTICIPANT_REPOSITORY_TOKEN)
    private readonly _quizParticipantRepository: IQuizParticipantRepository,
    @Inject(REACTION_QUERY_TOKEN) private readonly _reactionQuery: IReactionQuery
  ) {}
  public async postBinding(
    postEntity: PostEntity,
    dataBinding: {
      actor?: UserDto;
      mentionUsers?: UserDto[];
      groups?: GroupDto[];
      series?: SeriesEntity[];
      authUser: UserDto;
      reactionsCount?: ReactionsCount;
    }
  ): Promise<PostDto> {
    const userIdsNeedToFind = [];
    if (!dataBinding?.actor) {
      userIdsNeedToFind.push(postEntity.get('createdBy'));
    }
    let mentionUsers: UserMentionDto = {};
    if (postEntity.get('mentionUserIds')?.length && !dataBinding?.mentionUsers) {
      userIdsNeedToFind.push(...postEntity.get('mentionUserIds'));
    }

    const users = await this._userAdapter.findAllAndFilterByPersonalVisibility(
      userIdsNeedToFind,
      dataBinding.authUser.id
    );

    if (dataBinding?.mentionUsers?.length) {
      users.push(...dataBinding?.mentionUsers);
    }
    if (dataBinding?.actor) {
      users.push(dataBinding.actor);
    }

    const actor = users.find((user) => user.id === postEntity.get('createdBy'));

    if (postEntity.get('mentionUserIds') && users.length) {
      mentionUsers = this.mapMentionWithUserInfo(
        users.filter((user) => postEntity.get('mentionUserIds').includes(user.id))
      );
    }

    const groups =
      dataBinding?.groups || (await this._groupAdapter.getGroupByIds(postEntity.get('groupIds')));

    const audience = {
      groups: this.filterSecretGroupCannotAccess(groups, dataBinding?.authUser || null),
    };

    const communities = await this._groupAdapter.getGroupByIds(
      ArrayHelper.arrayUnique(audience.groups.map((group) => group.rootGroupId))
    );

    let quizHighestScore = null;
    let quizDoing = null;
    if (dataBinding?.authUser) {
      const quizHighestScoreMapper =
        await this._quizParticipantRepository.getQuizParticipantHighestScoreGroupByContentId(
          [postEntity.get('id')],
          dataBinding?.authUser.id
        );
      quizHighestScore = quizHighestScoreMapper.get(postEntity.get('id')) ?? null;
      const quizDoingMapper =
        await this._quizParticipantRepository.getQuizParticipantsDoingGroupByContentId(
          [postEntity.get('id')],
          dataBinding?.authUser.id
        );
      quizDoing = quizDoingMapper.get(postEntity.get('id')) ?? null;
    }

    return new PostDto({
      id: postEntity.get('id'),
      audience,
      content: postEntity.get('content'),
      createdAt: postEntity.get('createdAt'),
      publishedAt: postEntity.get('publishedAt'),
      tags: (postEntity.get('tags') || []).map((tag) => ({
        id: tag.get('id'),
        name: tag.get('name'),
        groupId: tag.get('groupId'),
      })),
      series: dataBinding.series
        ? dataBinding.series.map((series) => ({
            id: series.get('id'),
            title: series.get('title'),
          }))
        : undefined,
      quiz:
        postEntity.get('quiz') && postEntity.get('quiz').isVisible(dataBinding.authUser.id)
          ? new QuizDto({
              id: postEntity.get('quiz').get('id'),
              title: postEntity.get('quiz').get('title'),
              description: postEntity.get('quiz').get('description'),
              status: postEntity.get('quiz').get('status'),
              genStatus: postEntity.get('quiz').get('genStatus'),
              error: postEntity.get('quiz').get('error'),
            })
          : undefined,
      communities,
      media: {
        files: (postEntity.get('media').files || []).map((file) => new FileDto(file.toObject())),
        images: (postEntity.get('media').images || []).map(
          (image) => new ImageDto(image.toObject())
        ),
        videos: (postEntity.get('media').videos || []).map(
          (video) => new VideoDto(video.toObject())
        ),
      },
      mentions: mentionUsers,
      actor,
      status: postEntity.get('status'),
      type: postEntity.get('type'),
      privacy: postEntity.get('privacy'),
      setting: postEntity.get('setting'),
      commentsCount: postEntity.get('aggregation')?.commentsCount,
      totalUsersSeen: postEntity.get('aggregation')?.totalUsersSeen,
      linkPreview: postEntity.get('linkPreview')
        ? {
            url: postEntity.get('linkPreview').get('url'),
            title: postEntity.get('linkPreview').get('title'),
            description: postEntity.get('linkPreview').get('description'),
            image: postEntity.get('linkPreview').get('image'),
            domain: postEntity.get('linkPreview').get('domain'),
          }
        : null,
      markedReadPost: postEntity.get('markedReadImportant'),
      isSaved: postEntity.get('isSaved'),
      isReported: postEntity.get('isReported'),
      reactionsCount: dataBinding?.reactionsCount || [],
      ownerReactions: postEntity.get('ownerReactions'),
      quizHighestScore: quizHighestScore
        ? {
            quizParticipantId: quizHighestScore.get('id'),
            score: quizHighestScore.get('score'),
          }
        : undefined,
      quizDoing: quizDoing
        ? {
            quizParticipantId: quizDoing.get('id'),
          }
        : undefined,
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
    let actor = dataBinding?.actor;

    if (!actor) {
      actor = (
        await this._userAdapter.findAllAndFilterByPersonalVisibility(
          [articleEntity.get('createdBy')],
          dataBinding.authUser.id
        )
      )[0];
    }

    const groups =
      dataBinding?.groups ||
      (await this._groupAdapter.getGroupByIds(articleEntity.get('groupIds')));

    const audience = {
      groups: this.filterSecretGroupCannotAccess(groups, dataBinding.authUser),
    };

    const communities = await this._groupAdapter.getGroupByIds(
      ArrayHelper.arrayUnique(audience.groups.map((group) => group.rootGroupId))
    );

    let series = [];
    if (articleEntity.getSeriesIds().length > 0) {
      series = await this._contentRepo.findAll({
        attributes: {
          exclude: ['content'],
        },
        where: {
          groupArchived: false,
          isHidden: false,
          ids: articleEntity.getSeriesIds(),
        },
      });
    }

    const reactionsCount = await this._reactionQuery.getAndCountReactionByContents([
      articleEntity.getId(),
    ]);

    let quizHighestScore = null;
    let quizDoing = null;
    if (dataBinding?.authUser) {
      const quizHighestScoreMapper =
        await this._quizParticipantRepository.getQuizParticipantHighestScoreGroupByContentId(
          [articleEntity.get('id')],
          dataBinding?.authUser.id
        );
      quizHighestScore = quizHighestScoreMapper.get(articleEntity.get('id')) ?? null;
      const quizDoingMapper =
        await this._quizParticipantRepository.getQuizParticipantsDoingGroupByContentId(
          [articleEntity.get('id')],
          dataBinding?.authUser.id
        );
      quizDoing = quizDoingMapper.get(articleEntity.get('id')) ?? null;
    }
    return new ArticleDto({
      id: articleEntity.get('id'),
      audience,
      content: articleEntity.get('content'),
      createdAt: articleEntity.get('createdAt'),
      /**
       * Temporarily set publish to backward compatible with mobile
       */
      publishedAt: articleEntity.isWaitingSchedule()
        ? articleEntity.get('scheduledAt')
        : articleEntity.get('publishedAt'),
      scheduledAt: articleEntity.get('scheduledAt'),
      tags: (articleEntity.get('tags') || []).map((tag) => ({
        id: tag.get('id'),
        name: tag.get('name'),
        groupId: tag.get('groupId'),
      })),
      series: series
        ? series.map((series) => ({
            id: series.get('id'),
            title: series.get('title'),
          }))
        : undefined,
      quiz:
        articleEntity.get('quiz') && articleEntity.get('quiz').isVisible(dataBinding.authUser.id)
          ? new QuizDto({
              id: articleEntity.get('quiz').get('id'),
              title: articleEntity.get('quiz').get('title'),
              description: articleEntity.get('quiz').get('description'),
              status: articleEntity.get('quiz').get('status'),
              genStatus: articleEntity.get('quiz').get('genStatus'),
              error: articleEntity.get('quiz').get('error'),
            })
          : undefined,
      communities,
      actor,
      status: articleEntity.get('status'),
      title: articleEntity.get('title'),
      summary: articleEntity.get('summary'),
      type: articleEntity.get('type'),
      privacy: articleEntity.get('privacy'),
      setting: articleEntity.get('setting'),
      commentsCount: articleEntity.get('aggregation').commentsCount,
      totalUsersSeen: articleEntity.get('aggregation').totalUsersSeen,
      markedReadPost: articleEntity.get('markedReadImportant'),
      isSaved: articleEntity.get('isSaved'),
      isReported: articleEntity.get('isReported'),
      reactionsCount: reactionsCount.get(articleEntity.getId()) || [],
      ownerReactions: articleEntity.get('ownerReactions'),
      wordCount: articleEntity.get('wordCount'),
      coverMedia: articleEntity.get('cover')
        ? new ImageDto(articleEntity.get('cover').toObject())
        : null,
      categories: articleEntity.get('categories')?.map((category) => ({
        id: category.get('id'),
        name: category.get('name'),
      })),
      quizHighestScore: quizHighestScore
        ? {
            quizParticipantId: quizHighestScore.get('id'),
            score: quizHighestScore.get('score'),
          }
        : undefined,
      quizDoing: quizDoing
        ? {
            quizParticipantId: quizDoing.get('id'),
          }
        : undefined,
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
    const groups =
      dataBinding.groups && dataBinding.groups.length
        ? dataBinding.groups
        : await this._groupAdapter.getGroupByIds(seriesEntity.get('groupIds'));

    const audience = {
      groups: this.filterSecretGroupCannotAccess(groups, dataBinding.authUser),
    };

    const communities = await this._groupAdapter.getGroupByIds(
      ArrayHelper.arrayUnique(audience.groups.map((group) => group.rootGroupId))
    );

    let items = [];
    let userIdsNeedToFind = [seriesEntity.get('createdBy')];
    if (seriesEntity.get('itemIds')?.length) {
      const itemIds = seriesEntity.get('itemIds');
      items = await this._contentRepo.findAll({
        where: {
          ids: itemIds,
          excludeReportedByUserId: dataBinding.authUser?.id,
          isHidden: false,
          status: CONTENT_STATUS.PUBLISHED,
        },
        include: {
          shouldIncludeCategory: true,
          shouldIncludeQuiz: true,
        },
      });

      items.sort((a, b) => itemIds.indexOf(a.get('id')) - itemIds.indexOf(b.get('id')));
      userIdsNeedToFind = uniq([
        ...items.map((item) => item.get('createdBy')),
        ...userIdsNeedToFind,
      ]);
    }
    const users = await this._userAdapter.findAllAndFilterByPersonalVisibility(
      userIdsNeedToFind,
      dataBinding.authUser.id
    );

    return new SeriesDto({
      id: seriesEntity.get('id'),
      title: seriesEntity.get('title'),
      summary: seriesEntity.get('summary'),
      audience,
      items: (items || []).map((item) => {
        if (item instanceof PostEntity) {
          return {
            id: item.getId(),
            content: item.get('content'),
            createdAt: item.get('createdAt'),
            publishedAt: item.get('publishedAt'),
            setting: item.get('setting'),
            type: item.get('type'),
            actor: users.find((user) => user.id === item.get('createdBy')),
            isSaved: item.get('isSaved'),
            media: {
              files: item.get('media').files?.map((file) => new FileDto(file.toObject())),
              images: item.get('media').images?.map((image) => new ImageDto(image.toObject())),
              videos: item.get('media').videos?.map((video) => new VideoDto(video.toObject())),
            },
          };
        }
        if (item instanceof ArticleEntity) {
          return {
            id: item.getId(),
            title: item.get('title'),
            summary: item.get('summary'),
            type: item.get('type'),
            createdAt: item.get('createdAt'),
            publishedAt: item.get('publishedAt'),
            setting: item.get('setting'),
            actor: users.find((user) => user.id === item.get('createdBy')),
            isSaved: item.get('isSaved'),
            coverMedia: item.get('cover') ? new ImageDto(item.get('cover').toObject()) : null,
            categories: (item.get('categories') || []).map((category) => ({
              id: category.get('id'),
              name: category.get('name'),
            })),
          };
        }
      }),
      createdAt: seriesEntity.get('createdAt'),
      updatedAt: seriesEntity.get('updatedAt'),
      publishedAt: seriesEntity.get('publishedAt'),
      createdBy: seriesEntity.get('createdBy'),
      coverMedia: seriesEntity.get('cover')
        ? new ImageDto(seriesEntity.get('cover')?.toObject())
        : null,
      communities,
      actor: dataBinding.actor
        ? dataBinding.actor
        : users.find((user) => user.id === seriesEntity.get('createdBy')),
      status: seriesEntity.get('status'),
      type: seriesEntity.get('type'),
      privacy: seriesEntity.get('privacy'),
      isHidden: seriesEntity.get('isHidden'),
      setting: seriesEntity.get('setting'),
      commentsCount: seriesEntity.get('aggregation')?.commentsCount || 0,
      totalUsersSeen: seriesEntity.get('aggregation')?.totalUsersSeen || 0,
      markedReadPost: seriesEntity.get('markedReadImportant'),
      isSaved: seriesEntity.get('isSaved') || false,
      isReported: seriesEntity.get('isReported') || false,
    });
  }

  public async contentsBinding(
    contentEntities: (PostEntity | ArticleEntity | SeriesEntity)[],
    authUser: UserDto
  ): Promise<(PostDto | ArticleDto | SeriesDto)[]> {
    const {
      users,
      groups,
      communities,
      items,
      reactionsCount,
      quizDoingMapper,
      quizHighestScoreMapper,
    } = await this._getDataBindingForContents(contentEntities, authUser);
    const result = [];
    for (const contentEntity of contentEntities) {
      if (contentEntity instanceof PostEntity) {
        result.push(
          this._getPostDto(contentEntity, authUser, {
            users,
            groups,
            communities,
            reactionsCount,
            quizDoingMapper,
            quizHighestScoreMapper,
          })
        );
      }
      if (contentEntity instanceof ArticleEntity) {
        result.push(
          this._getArticleDto(contentEntity, authUser, {
            users,
            groups,
            communities,
            reactionsCount,
            quizDoingMapper,
            quizHighestScoreMapper,
          })
        );
      }
      if (contentEntity instanceof SeriesEntity) {
        result.push(
          this._getSeriesDto(contentEntity, authUser, {
            users,
            groups,
            communities,
            reactionsCount,
            items,
          })
        );
      }
    }

    return result;
  }

  private _getPostDto(
    entity: PostEntity,
    authUser: UserDto,
    dataBinding: {
      users: Map<string, UserDto>;
      groups: Map<string, GroupDto>;
      communities: Map<string, GroupDto>;
      reactionsCount: Map<string, ReactionsCount>;
      quizDoingMapper: Map<string, QuizParticipantEntity>;
      quizHighestScoreMapper: Map<string, QuizParticipantEntity>;
    }
  ): PostDto {
    const groups = [];
    const rootGroupIds = [];
    entity.getGroupIds().forEach((groupId) => {
      const group = dataBinding.groups.get(groupId);
      if (group) {
        groups.push(group);
        rootGroupIds.push(group.rootGroupId);
      }
    });

    const quizHighestScore = dataBinding.quizHighestScoreMapper.get(entity.getId()) || null;
    const quizDoing = dataBinding.quizDoingMapper.get(entity.getId()) || null;
    return new PostDto({
      id: entity.get('id'),
      audience: {
        groups,
      },
      content: entity.get('content'),
      createdAt: entity.get('createdAt'),
      publishedAt: entity.get('publishedAt'),
      tags: entity.get('tags')?.map((tag) => ({
        id: tag.get('id'),
        name: tag.get('name'),
        groupId: tag.get('groupId'),
      })),
      quiz:
        entity.get('quiz') && entity.get('quiz').isVisible(authUser.id)
          ? new QuizDto({
              id: entity.get('quiz').get('id'),
              title: entity.get('quiz').get('title'),
              description: entity.get('quiz').get('description'),
              status: entity.get('quiz').get('status'),
              genStatus: entity.get('quiz').get('genStatus'),
              error: entity.get('quiz').get('error'),
            })
          : undefined,
      communities: ArrayHelper.arrayUnique(rootGroupIds).map((rootGroupId) =>
        dataBinding.communities.get(rootGroupId)
      ),
      media: {
        files: entity.get('media').files?.map((file) => new FileDto(file.toObject())),
        images: entity.get('media').images?.map((image) => new ImageDto(image.toObject())),
        videos: entity.get('media').videos?.map((video) => new VideoDto(video.toObject())),
      },
      mentions: this.mapMentionWithUserInfo(
        entity.get('mentionUserIds').map((userId) => dataBinding.users.get(userId))
      ),
      actor: dataBinding.users.get(entity.getCreatedBy()),
      status: entity.get('status'),
      type: entity.get('type'),
      privacy: entity.get('privacy'),
      setting: entity.get('setting'),
      commentsCount: entity.get('aggregation')?.commentsCount,
      totalUsersSeen: entity.get('aggregation')?.totalUsersSeen,
      linkPreview: entity.get('linkPreview')
        ? {
            url: entity.get('linkPreview').get('url'),
            title: entity.get('linkPreview').get('title'),
            description: entity.get('linkPreview').get('description'),
            image: entity.get('linkPreview').get('image'),
            domain: entity.get('linkPreview').get('domain'),
          }
        : null,
      markedReadPost: entity.get('markedReadImportant'),
      isSaved: entity.get('isSaved'),
      isReported: entity.get('isReported'),
      reactionsCount: dataBinding.reactionsCount.get(entity.getId()),
      ownerReactions: entity.get('ownerReactions'),
      quizDoing: quizDoing
        ? {
            quizParticipantId: quizDoing.get('id'),
          }
        : undefined,
      quizHighestScore: quizHighestScore
        ? {
            quizParticipantId: quizHighestScore.get('id'),
            score: quizHighestScore.get('score'),
          }
        : undefined,
    });
  }

  private _getArticleDto(
    entity: ArticleEntity,
    authUser: UserDto,
    dataBinding: {
      users: Map<string, UserDto>;
      groups: Map<string, GroupDto>;
      communities: Map<string, GroupDto>;
      reactionsCount: Map<string, ReactionsCount>;
      series?: Map<string, SeriesEntity | PostEntity | ArticleEntity>;
      quizDoingMapper: Map<string, QuizParticipantEntity>;
      quizHighestScoreMapper: Map<string, QuizParticipantEntity>;
    }
  ): ArticleDto {
    const groups = [];
    const rootGroupIds = [];
    entity.getGroupIds().forEach((groupId) => {
      const group = dataBinding.groups.get(groupId);
      if (group) {
        groups.push(group);
        rootGroupIds.push(group.rootGroupId);
      }
    });

    const quizHighestScore = dataBinding.quizHighestScoreMapper.get(entity.getId()) || null;
    const quizDoing = dataBinding.quizDoingMapper.get(entity.getId()) || null;

    return new ArticleDto({
      id: entity.get('id'),
      audience: {
        groups,
      },
      content: entity.get('content'),
      createdAt: entity.get('createdAt'),
      publishedAt: entity.get('publishedAt'),
      tags: entity.get('tags')?.map((tag) => ({
        id: tag.get('id'),
        name: tag.get('name'),
        groupId: tag.get('groupId'),
      })),
      series: dataBinding.series
        ? entity.getSeriesIds().map((seriesId) => ({
            id: dataBinding.series.get(seriesId)?.getId(),
            title: dataBinding.series.get(seriesId)?.getTitle(),
          }))
        : undefined,
      quiz:
        entity.get('quiz') && entity.get('quiz').isVisible(authUser.id)
          ? new QuizDto({
              id: entity.get('quiz').get('id'),
              title: entity.get('quiz').get('title'),
              description: entity.get('quiz').get('description'),
              status: entity.get('quiz').get('status'),
              genStatus: entity.get('quiz').get('genStatus'),
              error: entity.get('quiz').get('error'),
            })
          : undefined,
      communities: ArrayHelper.arrayUnique(rootGroupIds).map((rootGroupId) =>
        dataBinding.communities.get(rootGroupId)
      ),
      actor: dataBinding.users.get(entity.getCreatedBy()),
      status: entity.get('status'),
      title: entity.get('title'),
      summary: entity.get('summary'),
      type: entity.get('type'),
      privacy: entity.get('privacy'),
      setting: entity.get('setting'),
      commentsCount: entity.get('aggregation').commentsCount,
      totalUsersSeen: entity.get('aggregation').totalUsersSeen,
      markedReadPost: entity.get('markedReadImportant'),
      isSaved: entity.get('isSaved'),
      isReported: entity.get('isReported'),
      reactionsCount: dataBinding.reactionsCount.get(entity.getId()) || [],
      ownerReactions: entity.get('ownerReactions'),
      wordCount: entity.get('wordCount'),
      coverMedia: entity.get('cover') ? new ImageDto(entity.get('cover').toObject()) : null,
      categories: entity.get('categories')?.map((category) => ({
        id: category.get('id'),
        name: category.get('name'),
      })),
      quizDoing: quizDoing
        ? {
            quizParticipantId: quizDoing.get('id'),
          }
        : undefined,
      quizHighestScore: quizHighestScore
        ? {
            quizParticipantId: quizHighestScore.get('id'),
            score: quizHighestScore.get('score'),
          }
        : undefined,
    });
  }

  private _getSeriesDto(
    entity: SeriesEntity,
    authUser: UserDto,
    dataBinding: {
      users: Map<string, UserDto>;
      groups: Map<string, GroupDto>;
      communities: Map<string, GroupDto>;
      reactionsCount: Map<string, ReactionsCount>;
      items: Map<string, PostEntity | ArticleEntity | SeriesEntity>;
    }
  ): SeriesDto {
    const groups = [];
    const rootGroupIds = [];
    entity.getGroupIds().forEach((groupId) => {
      const group = dataBinding.groups.get(groupId);
      if (group) {
        groups.push(group);
        rootGroupIds.push(group.rootGroupId);
      }
    });

    const items = [];
    entity.get('itemIds').forEach((itemId) => {
      const itemEntity = dataBinding.items.get(itemId);
      if (itemEntity) {
        items.push(itemEntity);
      }
    });
    return new SeriesDto({
      id: entity.get('id'),
      audience: {
        groups,
      },
      title: entity.get('title'),
      summary: entity.get('summary'),
      createdAt: entity.get('createdAt'),
      updatedAt: entity.get('updatedAt'),
      publishedAt: entity.get('publishedAt'),
      communities: ArrayHelper.arrayUnique(rootGroupIds).map((rootGroupId) =>
        dataBinding.communities.get(rootGroupId)
      ),
      quiz:
        entity.get('quiz') && entity.get('quiz').isVisible(authUser.id)
          ? new QuizDto({
              id: entity.get('quiz').get('id'),
              title: entity.get('quiz').get('title'),
              description: entity.get('quiz').get('description'),
              status: entity.get('quiz').get('status'),
              genStatus: entity.get('quiz').get('genStatus'),
              error: entity.get('quiz').get('error'),
            })
          : undefined,
      items: items.map((item) => {
        if (item instanceof PostEntity) {
          return {
            id: item.getId(),
            content: item.get('content'),
            createdAt: item.get('createdAt'),
            publishedAt: item.get('publishedAt'),
            setting: item.get('setting'),
            type: item.get('type'),
            media: {
              files: item.get('media').files?.map((file) => new FileDto(file.toObject())),
              images: item.get('media').images?.map((image) => new ImageDto(image.toObject())),
              videos: item.get('media').videos?.map((video) => new VideoDto(video.toObject())),
            },
          };
        }
        if (item instanceof ArticleEntity) {
          return {
            id: item.getId(),
            title: item.get('title'),
            summary: item.get('summary'),
            type: item.get('type'),
            createdAt: item.get('createdAt'),
            publishedAt: item.get('publishedAt'),
            setting: item.get('setting'),
            coverMedia: item.get('cover') ? new ImageDto(item.get('cover').toObject()) : null,
          };
        }
        return null;
      }),
      actor: dataBinding.users.get(entity.getCreatedBy()),
      status: entity.get('status'),
      type: entity.get('type'),
      privacy: entity.get('privacy'),
      setting: entity.get('setting'),
      commentsCount: entity.get('aggregation')?.commentsCount,
      totalUsersSeen: entity.get('aggregation')?.totalUsersSeen,
      markedReadPost: entity.get('markedReadImportant'),
      isSaved: entity.get('isSaved'),
      isReported: entity.get('isReported'),
      coverMedia: entity.get('cover') ? new ImageDto(entity.get('cover').toObject()) : null,
    });
  }

  private async _getDataBindingForContents(
    contentEntities: (PostEntity | ArticleEntity | SeriesEntity)[],
    authUser: UserDto
  ): Promise<{
    users: Map<string, UserDto>;
    groups: Map<string, GroupDto>;
    communities: Map<string, GroupDto>;
    reactionsCount: Map<string, ReactionsCount>;
    items: Map<string, PostEntity | ArticleEntity | SeriesEntity>;
    series: Map<string, SeriesEntity | PostEntity | ArticleEntity>;
    quizHighestScoreMapper: Map<string, QuizParticipantEntity>;
    quizDoingMapper: Map<string, QuizParticipantEntity>;
  }> {
    const userIdsNeedToFind = [];
    const itemIds = [];
    const groupIds = [];
    const contentIds = [];
    const seriesIds = [];
    contentEntities.forEach((contentEntity) => {
      userIdsNeedToFind.push(contentEntity.getCreatedBy());
      groupIds.push(...contentEntity.getGroupIds());
      contentIds.push(contentEntity.getId());
      if (contentEntity instanceof PostEntity) {
        userIdsNeedToFind.push(...contentEntity.get('mentionUserIds'));
      }
      if (contentEntity instanceof SeriesEntity) {
        itemIds.push(...contentEntity.get('itemIds'));
      }
    });
    const users = await this._userAdapter.findAllAndFilterByPersonalVisibility(
      ArrayHelper.arrayUnique(userIdsNeedToFind),
      authUser.id
    );

    const usersMapper = new Map<string, UserDto>(
      users.map((user) => {
        return [user.id, user];
      })
    );

    const items = await this._contentRepo.findAll({
      where: {
        ids: itemIds,
        excludeReportedByUserId: authUser?.id,
        isHidden: false,
        status: CONTENT_STATUS.PUBLISHED,
      },
    });
    const itemsMapper = new Map<string, PostEntity | ArticleEntity | SeriesEntity>(
      items.map((item) => {
        return [item.getId(), item];
      })
    );

    const groups = await this._groupAdapter.getGroupByIds(ArrayHelper.arrayUnique(groupIds));
    const groupFiltered = this.filterSecretGroupCannotAccess(groups, authUser);

    const groupsMapper = new Map<string, GroupDto>(
      groupFiltered.map((group) => {
        return [group.id, group];
      })
    );

    const communities = await this._groupAdapter.getGroupByIds(
      ArrayHelper.arrayUnique(groupFiltered.map((group) => group.rootGroupId))
    );

    const communitiesMapper = new Map<string, GroupDto>(
      communities.map((community) => {
        return [community.id, community];
      })
    );

    const reactionsCount = await this._reactionQuery.getAndCountReactionByContents(contentIds);

    let series = new Map<string, SeriesEntity | PostEntity | ArticleEntity>();
    if (seriesIds.length > 0) {
      const seriesEntities = await this._contentRepo.findAll({
        attributes: {
          exclude: ['content'],
        },
        where: {
          groupArchived: false,
          isHidden: false,
          ids: seriesIds,
        },
      });
      series = new Map<string, SeriesEntity | PostEntity | ArticleEntity>(
        seriesIds.map((seriesId) => {
          return [seriesId, seriesEntities.find((series) => series.getId() === seriesId)];
        })
      );
    }

    let quizHighestScoreMapper = new Map<string, QuizParticipantEntity>();
    let quizDoingMapper = new Map<string, QuizParticipantEntity>();
    if (authUser) {
      quizHighestScoreMapper =
        await this._quizParticipantRepository.getQuizParticipantHighestScoreGroupByContentId(
          contentIds,
          authUser.id
        );
      quizDoingMapper =
        await this._quizParticipantRepository.getQuizParticipantsDoingGroupByContentId(
          contentIds,
          authUser.id
        );
    }
    return {
      groups: groupsMapper,
      users: usersMapper,
      communities: communitiesMapper,
      items: itemsMapper,
      reactionsCount,
      series,
      quizHighestScoreMapper,
      quizDoingMapper,
    };
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
}
